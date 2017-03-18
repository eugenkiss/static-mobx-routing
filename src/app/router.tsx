import * as React from 'react'
import {observable, computed, action, reaction} from 'mobx'
import {serializable, serialize, deserialize} from 'serializr'
import {Router} from 'director/build/director'
import {Id} from 'app/models/id'
import {uiStore} from 'app/store'
import {Login} from 'app/comps/login'
import {Search} from 'app/comps/search'
import {PostComp} from 'app/comps/post'
import {NotFound} from 'app/comps/notfound'
import {mapToQueryString, gup} from 'app/utils'

export function startRouter() {
  // update state on url change
  const enrichedRoutes = {}
  for (const k of Object.keys(routes)) {
    const go = routes[k]
    enrichedRoutes[k] = (...args) => {
      if (!uiStore.history.canNavigate) return
      const uninitialized = uiStore.route == null
      uiStore.history.callSaveUiStateListeners(uiStore.history.currentRoute, 'temp')
      go(...args)
      if (uninitialized) uiStore.history.setInitial(uiStore.route)
    }
  }
  new Router(enrichedRoutes).configure({
    'notfound': () => uiStore.goRouteNotFound(),
    html5history: true
  }).init()

  // update url on state changes
  reaction(() => uiStore.route, () => {
    const route = uiStore.route
    if (route.name === 'notfound') return
    const windowPathWithParams = window.location.search !== ''
      ? `${window.location.pathname}${window.location.search}`
      : window.location.pathname
    if (route.pathWithParams !== windowPathWithParams) {
      if (uiStore.route.shouldReplace(null)) {
        uiStore.history.replace(route)
      } else {
        uiStore.history.push(route)
      }
    }
  })
}

export function jsonToRoute(o: any): Route {
  const f = nameMap[o.name]
  if (f == null) throw `IMPOSSIBLE: Unhandled case route deserialization for '${o.name}'!`
  return f(o)
}

const routes: { [n: string]: (...args : any[]) => void } = {}
const nameMap: { [n: string]: (o: any) => Route } = {}

abstract class BaseRoute {
  abstract path: string
  abstract pathTest: string
  abstract pageTitle: string
  comp: any = null
  protected _params = observable.map<any>()
  get params() { return this._params }
  parseParams(paramString) {}
  get pathWithParams() {
    const params = mapToQueryString(this.params)
    return params !== ''
      ? `${this.path}?${params}`
      : this.path
  }
  shouldReplace(fromRoute: Route) { return false }
  canExit(event?) { return true }
  abstract toJson(): any
}

export type Route = NotFoundRoute | LoginRoute | SearchRoute | NewPostRoute | PostRoute


export class NotFoundRoute extends BaseRoute {
  name: 'notfound' = 'notfound'
  path = ''
  pathTest = ''
  pageTitle = 'Not Found'
  comp = <NotFound/>

  go = NotFoundRoute.go
  static go = () => uiStore.goRouteNotFound()

  toJson() { return { name: this.name } }
  static fromJson(o: any) { return new NotFoundRoute() }
}
nameMap[new NotFoundRoute().name] = NotFoundRoute.fromJson


export class LoginRoute extends BaseRoute {
  name: 'login' = 'login'
  path = '/login'
  pathTest = this.path
  pageTitle = 'Login'
  comp = <Login/>

  go = LoginRoute.go
  static go = () => uiStore.goLogin()

  toJson() { return { name: this.name } }
  static fromJson(o: any) { return new LoginRoute() }
}
routes[new LoginRoute().pathTest] = LoginRoute.go
nameMap[new LoginRoute().name] = LoginRoute.fromJson


export class SearchRoute extends BaseRoute {
  name: 'search' = 'search'
  path = '/'
  pathTest = '/'
  @computed get pageTitle() {
    return this.search ? `Search: ${this.search}` : 'Search'
  }
  comp = <Search route={this}/>

  get search(): string { return this._params.get('search') || '' }
  private setSearch(v: string) { this._params.set('search', v) }
  @action parseParams(paramString) { this.setSearch(gup('search', paramString)) }

  constructor(search?: string) {
    super()
    if (search) this.setSearch(search)
  }

  shouldReplace(fromRoute: Route) { return uiStore.history.currentRoute.name === 'search' }

  go = () => SearchRoute.go(this.search)
  static go = (search?: string) => uiStore.goSearch(search)

  toJson() { return { name: this.name, search: this.search } }
  static fromJson(o: any) { return new SearchRoute(o.search) }
}
routes[new SearchRoute().pathTest] = SearchRoute.go
nameMap[new SearchRoute().name] = SearchRoute.fromJson


function canExitFromPost(event?) {
  if (uiStore.post == null || !uiStore.post.isDirty()) return true
  const msg = 'Post not saved yet. Do you really want to leave?'
  if (event != null) event.returnValue = msg
  if (confirm(msg)) {
    uiStore.post = null
    return true
  }
  return false
}

export class NewPostRoute extends BaseRoute {
  name: 'new-post' = 'new-post'
  path = '/new'
  pathTest = '/new'
  pageTitle = 'New Post'
  comp = <PostComp route={this}/>

  go = NewPostRoute.go
  static go = () => uiStore.goNewPost()

  canExit(event?) { return canExitFromPost(event) }

  toJson() { return { name: this.name } }
  static fromJson(o: any) { return new NewPostRoute() }
}
routes[new NewPostRoute().pathTest] = NewPostRoute.go
nameMap[new NewPostRoute().name] = NewPostRoute.fromJson


export class PostRoute extends BaseRoute {
  @serializable name: 'post' = 'post'
  get path() { return `/posts/${this.id}` }
  pathTest = '/posts/:id'
  @computed get pageTitle() {
    return (uiStore.post && uiStore.post.title) || this.title ||
      this.notFound && `Not Found Post ${this.id}` || this.error && `Error Loading Post ${this.id}` ||
      `Loading Post ${this.id}`
  }
  comp = <PostComp route={this}/>

  @serializable id: Id
  @serializable title: string
  @serializable cacheHit: boolean
  @observable @serializable editing = false
  @observable error = false
  @observable notFound = false // TODO: Should maybe rather be part of request object?
  constructor(id: Id, title?: string, cacheHit?: boolean, editing?: boolean) {
    super()
    this.id = id
    this.title = title
    this.cacheHit = cacheHit
    this.editing = editing
  }

  shouldReplace(fromRoute: Route) { return uiStore.history.currentRoute.name === 'new-post' }

  go = () => uiStore.goPost(this.id,  this.title, this.editing)
  static go = (id) => uiStore.goPost(id)

  canExit(event?) { return canExitFromPost(event) }

  toJson() { return serialize(this) }
  static fromJson(o: any) { return deserialize(PostRoute, o) }
}
routes[new PostRoute(null).pathTest] = PostRoute.go
nameMap[new PostRoute(null).name] = PostRoute.fromJson
