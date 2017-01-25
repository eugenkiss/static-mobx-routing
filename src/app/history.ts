import {observable, action} from 'mobx'
import {Route, jsonToRoute} from 'app/router'
import {UiStore, uiStore} from 'app/store'

export class History {
  @observable routes = observable.array<Route>()
  @observable cursor = 0

  constructor(private store: UiStore) {}

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
    this.cursor = savedCursor
    uiStore.route = this.routes[this.cursor]
  }

  get canNavigate() { return !this.preventNavigationTemporarily }

  private persist = () => {
    sessionStorage.setItem('routes', JSON.stringify(this.routes.map(r => r.toJson())))
    sessionStorage.setItem('historyCur', JSON.stringify(this.cursor))
  }

  restore = () => {
    const routesJson = sessionStorage.getItem('routes')
    const historyCurJson = sessionStorage.getItem('historyCur')
    if (routesJson == null || historyCurJson == null) return
    this.routes = JSON.parse(routesJson).map(o => o == null ? null : jsonToRoute(o))
    this.cursor = JSON.parse(historyCurJson)
  }

  @action setInitial = (route: Route) => {
    if (this.routes.length !== 0) return
    this.replace(route)
  }

  @action push = (route: Route) => {
    if (!this.canExitCurrentRoute()) return
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
