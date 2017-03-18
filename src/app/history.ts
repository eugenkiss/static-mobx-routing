import {observable, action} from 'mobx'
import {Route, jsonToRoute} from 'app/router'

type SaveUiStateListener = (route: Route) => { id: string, data: any } | null

export class History {
  uiStates: {[url:string]: {[id:string]: any}} = {}
  get uiState() { return this.uiStates[window.location.href] }
  uiStateFor(id: string) { return this.uiState != null ? this.uiState[id] : null }
  saveUiStateListeners = new Array<SaveUiStateListener>()
  @observable cursor = 0 // Unfortunately, not reliable as popstate is not called in all necessary situations
  @observable routes = observable.array<Route>() // Only necessary to visualize history
  popstated = false // TODO: Still needed?

  constructor() {
    let prevUrl = window.location.href
    setInterval(() => {
      if (window.location.href !== prevUrl) {
        if (this.uiStates['temp'] != null) {
          this.uiStates[prevUrl] = this.uiStates['temp']
          delete this.uiStates['temp']
        }
        prevUrl = window.location.href
      }
    }, 10)
  }

  addSaveUiStateListener = (listener: SaveUiStateListener): SaveUiStateListener => {
    this.saveUiStateListeners.push(listener)
    return listener
  }

  removeSaveUiStateListener = (listener: SaveUiStateListener) => {
    this.saveUiStateListeners.splice(this.saveUiStateListeners.indexOf(listener), 1)
  }

  callSaveUiStateListeners = (route: Route, url: string) => {
    for (const listener of this.saveUiStateListeners) {
      const res = listener(route)
      const saved = this.uiStates[url] || {}
      if (res != null) saved[res.id] = res.data
      this.uiStates[url] = saved
    }
  }

  initWindowListeners = () => {
    if ('scrollRestoration' in history) { history.scrollRestoration = 'manual' }
    window.addEventListener('load', () => this.popstated = false)
    window.addEventListener('popstate', this.handlePopstate)
    window.addEventListener('unload', this.handleUnload)
    window.addEventListener('beforeunload', this.canExitCurrentRoute)
  }

  private canExitCurrentRoute = (e?): boolean => {
    const route = this.currentRoute
    if (route == null) return true
    return route.canExit(e)
  }

  private handleUnload = () => {
    //this.routes[this.cursor] = this.store.route // Leads to unwanted side effects but might be necessary for some situations...
    this.persist()
  }

  private ignoreNextExitCheck = false
  private preventNavigationTemporarily = false
  @action private handlePopstate = (e) => {
    const savedCursor = e.state
    if (!this.ignoreNextExitCheck && !this.canExitCurrentRoute(e)) {
      // beforeunload is not called when clicking on back button (kind of understandable)
      // here's our workaround (won't work if you go to a history entry outside the app but still good enough)
      if (savedCursor == null) return
      // readjust browser history
      const dif = this.cursor - savedCursor
      this.ignoreNextExitCheck = true
      this.preventNavigationTemporarily = true
      window.history.go(dif)
      return
    }
    if (this.ignoreNextExitCheck) {
      this.ignoreNextExitCheck = false
      setTimeout(() => this.preventNavigationTemporarily = false, 10)
      return
    }
    if (savedCursor == null) return
    this.popstated = true
    this.cursor = savedCursor
  }

  get canNavigate() { return !this.preventNavigationTemporarily }

  private persist = () => {
    this.callSaveUiStateListeners(this.currentRoute, window.location.href)
    sessionStorage.setItem('routes', JSON.stringify(this.routes.map(r => r.toJson())))
    sessionStorage.setItem('historyCur', JSON.stringify(this.cursor))
    sessionStorage.setItem('uiStates', JSON.stringify(this.uiStates))
  }

  restore = () => {
    const routesJson = sessionStorage.getItem('routes')
    const historyCurJson = sessionStorage.getItem('historyCur')
    const uiStatesJson = sessionStorage.getItem('uiStates')
    if (routesJson == null || historyCurJson == null || uiStatesJson == null) return
    this.routes = JSON.parse(routesJson).map(o => o == null ? null : jsonToRoute(o))
    this.cursor = JSON.parse(historyCurJson)
    this.uiStates = JSON.parse(uiStatesJson)
  }

  @action setInitial = (route: Route) => {
    if (window.history.state == null && this.routes.length > 0) {
      // For the case that user does not simply refresh the page, but changes the url -> cut history
      // TODO: However, ui state restoration and history visualization is broken after that as popstate
      // is not called when clicking back button and the restored cursor will be wrong... See README
      this.cursor++
      this.routes.length = this.cursor + 1
    }
    this.replace(route)
  }

  @action push = (route: Route) => {
    if (!this.canExitCurrentRoute()) return
    this.callSaveUiStateListeners(this.currentRoute, window.location.href)
    this.cursor += 1
    this.routes.length = this.cursor
    this.routes.push(route)
    window.history.pushState(this.cursor, null, route.pathWithParams)
  }

  @action replace = (route: Route) => {
    if (!this.canExitCurrentRoute()) return
    this.routes[this.cursor] = route
    window.history.replaceState(this.cursor, null, route.pathWithParams)
  }

  @action back = () => {
    if (!this.canExitCurrentRoute()) return
    this.cursor--
    window.history.back()
  }

  @action goToIndex = (index: number) => {
    if (!this.canExitCurrentRoute()) return
    const dif = index - this.cursor
    if (dif === 0) return
    this.cursor = this.cursor + dif
    window.history.go(dif)
  }

  get currentRoute(): Route {
    if (this.routes.length === 0) return null
    return this.routes[this.cursor]
  }
}
