import {observable, action, computed} from 'mobx'
import {Route, jsonToRoute} from 'app/router'
import {UiStore, uiStore} from 'app/store'

type SaveUiStateListener = (route: Route) => { name: string, data: any } | null

export class History {
  uiStates: any = {}
  @observable routes = observable.array<Route>()
  @observable cursor = 0
  saveUiStateListeners = new Array<SaveUiStateListener>()
  @computed get uiState() { return this.uiStates[this.cursor] }

  constructor(private store: UiStore) {}

  addSaveUiStateListener = (listener: SaveUiStateListener): SaveUiStateListener => {
    this.saveUiStateListeners.push(listener)
    return listener
  }

  removeSaveUiStateListener = (listener: SaveUiStateListener) => {
    this.saveUiStateListeners.splice(this.saveUiStateListeners.indexOf(listener), 1)
  }

  private callSaveUiStateListeners = (route: Route) => {
    for (const listener of this.saveUiStateListeners) {
      const res = listener(route)
      const saved = this.uiStates[this.cursor] || {}
      if (res != null) saved[res.name] = res.data
      this.uiStates[this.cursor] = saved
    }
  }

  initWindowListeners = () => {
    if ('scrollRestoration' in history) { history.scrollRestoration = 'manual' }
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
    this.routes[this.cursor] = this.store.route
    this.persist()
  }

  private ignoreNextExitCheck = false
  private preventNavigationTemporarily = false
  private handlePopstate = async (e) => {
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
    this.callSaveUiStateListeners(this.currentRoute)
    this.cursor = savedCursor
    uiStore.route = this.routes[this.cursor]
  }

  get canNavigate() { return !this.preventNavigationTemporarily }

  private persist = () => {
    this.callSaveUiStateListeners(this.currentRoute)
    sessionStorage.setItem('routes', JSON.stringify(this.routes.map(r => r.toJson())))
    sessionStorage.setItem('historyCur', JSON.stringify(this.cursor))
    sessionStorage.setItem('uiStates', JSON.stringify(this.uiStates))
  }

  restore = () => {
    const routesJson = sessionStorage.getItem('routes')
    const historyCurJson = sessionStorage.getItem('historyCur')
    const uiStates = sessionStorage.getItem('uiStates')
    if (routesJson == null || historyCurJson == null || uiStates == null) return
    this.routes = JSON.parse(routesJson).map(o => o == null ? null : jsonToRoute(o))
    this.cursor = JSON.parse(historyCurJson)
    this.uiStates = JSON.parse(uiStates)
  }

  @action setInitial = (route: Route) => {
    if (this.routes.length !== 0) return
    this.replace(route)
  }

  @action push = (route: Route) => {
    if (!this.canExitCurrentRoute()) return
    this.callSaveUiStateListeners(this.currentRoute)
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
    window.history.back()
  }

  @action goToIndex = (index: number) => {
    if (!this.canExitCurrentRoute()) return
    const dif = index - this.cursor
    if (dif === 0) return
    this.cursor = index
    window.history.go(dif)
  }

  get currentRoute(): Route {
    if (this.routes.length === 0) return null
    return this.routes[this.cursor]
  }
}
