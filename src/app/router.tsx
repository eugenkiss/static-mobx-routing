import * as React from 'react'
import {observable, autorun, computed, action} from 'mobx'
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
  new Router(routes).configure({
    'notfound': () => uiStore.goRouteNotFound(),
    html5history: true
  }).init()

  // update url on state changes
  autorun(() => {
    const route = uiStore.route
    if (route.name === 'notfound') return
    const fromRoute = null
    const params = mapToQueryString(route.params)
    const path = params !== ''
      ? `${route.path}?${params}`
      : route.path
    const windowPath = window.location.search !== ''
      ? `${window.location.pathname}${window.location.search}`
      : window.location.pathname
    if (path !== windowPath) {
      if (fromRoute != null && uiStore.route.shouldReplace(fromRoute)) {
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
  shouldReplace(fromRoute: Route) { return false }
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

  shouldReplace(fromRoute: Route) { return fromRoute.name === 'search' }

  go = () => SearchRoute.go(this.search)
  static go = (search?: string) => uiStore.goSearch(search)

  toJson() { return { name: this.name, search: this.search } }
  static fromJson(o: any) { return new SearchRoute(o.search) }
}
routes[new SearchRoute().pathTest] = SearchRoute.go
nameMap[new SearchRoute().name] = SearchRoute.fromJson


export class NewPostRoute extends BaseRoute {
  name: 'new-post' = 'new-post'
  path = '/new'
  pathTest = '/new'
  pageTitle = 'New Post'
  comp = <PostComp route={this}/>

  go = NewPostRoute.go
  static go = () => uiStore.goNewPost()

  toJson() { return { name: this.name } }
  static fromJson(o: any) { return new NewPostRoute() }
}
routes[new NewPostRoute().pathTest] = NewPostRoute.go
nameMap[new NewPostRoute().name] = NewPostRoute.fromJson


export class PostRoute extends BaseRoute {
  name: 'post' = 'post'
  get path() { return `/posts/${this.id}` }
  pathTest = '/posts/:id'
  @computed get pageTitle() { return uiStore.post != null ? uiStore.post.title : 'Post error' }
  comp = <PostComp route={this}/>

  @observable notFound = false // TODO: Should rather be part of request object
  @observable editing = false
  constructor(
    public id: Id,
    public title?: string,
    public cacheHit?: boolean) {
    super()
  }

  shouldReplace(fromRoute: Route) { return fromRoute.name === 'new-post' }

  go = () => uiStore.goPost(this.id,  this.title)
  static go = (id) => uiStore.goPost(id)

  toJson() { return {
    name: this.name,
    id: this.id,
    title: this.title,
    editing: this.editing
  } }
  static fromJson(o: any) {
    const s = new PostRoute(o.id, o.title)
    s.editing = o.editing
    return s
  }
}
routes[new PostRoute(null).pathTest] = PostRoute.go
nameMap[new PostRoute(null).name] = PostRoute.fromJson
