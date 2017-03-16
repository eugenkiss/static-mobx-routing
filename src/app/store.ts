import {observable, action, runInAction, autorun} from 'mobx'
import {Post} from 'app/models/post'
import {User} from 'app/models/user'
import {Id} from 'app/models/id'
import {ApiClient, api, ApiError} from 'app/api-client'
import {History} from 'app/history'
import {Route, SearchRoute, LoginRoute, PostRoute, NewPostRoute, NotFoundRoute} from 'app/router'
import {RequestState} from 'app/utils'

export class UiStore {
  @observable windowWidth = 1
  @observable windowHeight = 1

  @observable unauthorized = false

  history = new History(this)

  @observable route: Route
  @observable me: User

  @observable postSummariesInitialized = false
  @observable postSummaries = new Array<Post>()

  @observable post: Post
  @observable cachedPosts = observable.map<Post>()

  constructor(public api: ApiClient) {
    window.addEventListener('unhandledrejection', this.handleUnhandledExceptions)

    this.handleResize()
    window.addEventListener('resize', this.handleResize)

    this.history.restore()
    this.history.initWindowListeners()

    this.getMe().then()

    autorun(() => {
      if (this.route == null) return
      document.title = this.route.pageTitle
    })
  }

  private clearCache = () => {
    this.me = null
    this.postSummariesInitialized = false
    this.postSummaries.length = 0
    this.post = null
    this.cachedPosts.clear()
  }

  private handleUnhandledExceptions = (e) => {
    const reason = e.reason
    if (reason instanceof ApiError) {
      e.preventDefault()
      if (reason.statusCode === 401) uiStore.goLogin()
      return
    }
  }

  @action private handleResize = () => {
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight
  }

  @action goRouteNotFound = () => {
    this.route = new NotFoundRoute()
  }

  @action goLogin = () => {
    this.route = new LoginRoute()
  }

  @action goSearch = (search?: string) => {
    const route = new SearchRoute(search)
    if (search == null) route.parseParams(window.location.search)
    this.route = route
    this.refreshPostSummaries().then()
  }

  @observable getPostRequest = new RequestState('null')
  @action goPost = async (id: Id, title?: string) => {
    this.post = this.cachedPosts.get(id)
    const route = new PostRoute(id, title, this.post != null)
    this.route = route
    let post = null
    const req = new RequestState()
    this.getPostRequest = req
    try {
      post = await this.api.getPost(id)
      req.succeed()
      this.cachedPosts.set(id, post)
      if (this.getPostRequest.start > req.start || route !== this.route) {
        console.log('Race condition prevented')
        return
      }
    } catch (e) {
      req.fail(e.message)
      route.error = true
      if (this.getPostRequest.start > req.start || route !== this.route) {
        console.log('Race condition prevented')
        return
      }
      if (!(e instanceof ApiError)) throw e
      if (e.statusCode !== 404) throw e
      route.notFound = true
    }
    if (post) route.title = post.title
    this.post = post
  }

  @action goNewPost = () => {
    this.post = new Post({title: ''})
    this.route = new NewPostRoute()
  }

  @observable loginRequest = new RequestState('null')
  @action login = async (username: string, password: string) => {
    const req = new RequestState()
    this.loginRequest = req
    try {
      await this.api.login(username, password)
      req.succeed()
      this.unauthorized = false
      this.getMe().then()
      this.goSearch()
    } catch (e) {
      req.fail(e.message)
      this.goLogin()
      if (!(e instanceof ApiError)) throw e
    }
  }

  @action logout = async () => {
    await this.api.logout()
    this.unauthorized = true
    this.clearCache()
    this.goLogin()
  }

  @action getMe = async () => {
    this.me = await this.api.getMe()
  }

  @observable getPostSummariesRequest = new RequestState('null')
  @action refreshPostSummaries = async () => {
    const req = new RequestState()
    this.getPostSummariesRequest = req
    try {
      const posts = await this.api.getPosts()
      runInAction(() => {
        req.succeed()
        this.postSummariesInitialized = true
        this.postSummaries = posts
      })
    } catch (e) {
      req.fail(e.message)
    }
  }

  @action addPost = async (post: Post) => {
    this.post = await this.api.addPost(post)
    this.cachedPosts.set(this.post.id, this.post)
    this.goPost(this.post.id, this.post.title)
  }

  @action savePost = async (post: Post) => {
    this.post = await this.api.savePost(post)
  }

  @observable savePostRequest = new RequestState('null')
  @action saveCurrentPost = async () => {
    const req = new RequestState()
    this.savePostRequest = req
    try {
      if (this.post.id == null) {
        await this.addPost(this.post)
      } else {
        await this.savePost(this.post)
      }
      req.succeed()
    } catch (e) {
      req.fail(e.message)
      throw e
    }
  }

  @action resetCurrentPost = () => {
    if (this.route.name === 'new-post') {
      this.history.back()
    } else {
      this.post.reset()
    }
  }
}

export const uiStore = new UiStore(api)
