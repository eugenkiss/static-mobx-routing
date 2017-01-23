import {observable, action} from 'mobx'
import {Route, jsonToRoute} from 'app/router'
import {UiStore, uiStore} from 'app/store'

export class History {
  @observable routes = new Array<Route>()
  @observable cursor = 0

  constructor(private store: UiStore) {}

  initWindowListeners = () => {
    if ('scrollRestoration' in history) { history.scrollRestoration = 'manual' }
    window.addEventListener('popstate', this.handlePopstate)
    window.addEventListener('unload', this.handleUnload)
  }

  private handleUnload = () => {
    this.routes[this.cursor] = this.store.route
    this.persist()
  }

  private handlePopstate = async (e) => {
    const savedCursor = e.status
    if (savedCursor == null) return
    this.cursor = savedCursor
    uiStore.route = this.routes[this.cursor]
  }

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
    this.routes.push(route)
  }

  @action push = (route: Route) => {
    this.cursor += 1
    this.routes.length = this.cursor
    this.routes.push(route)
    window.history.pushState(this.cursor, null, route.pathWithParams)
  }

  @action replace = (route: Route) => {
    this.routes[this.cursor] = route
    window.history.replaceState(this.cursor, null, route.pathWithParams)
  }

  @action goToIndex = (index: number) => {
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
