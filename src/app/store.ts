import {observable, action, runInAction, autorun} from 'mobx'
import {Post} from 'app/models/post'
import {User} from 'app/models/user'
import {Id} from 'app/models/id'
import {ApiClient, api, ApiError} from 'app/api-client'
import {History} from 'app/history'
import {Route, SearchRoute, LoginRoute, PostRoute, NewPostRoute, NotFoundRoute} from 'app/router'
import {RequestState} from 'app/utils'

// Note: Only ever assign a new route in the goX methods so that
// the canNavigate precondition and side-effects are always considered.

export class UiStore {
  @observable windowWidth = 1
  @observable windowHeight = 1

  @observable unauthorized = false

  history = new History(this)

  @observable route: Route = new SearchRoute()
  @observable me: User

  @observable postSummariesInitialized = false
  @observable postSummaries = new Array<Post>()

  @observable post: Post
  @observable cachedPosts = observable.map<Post>()

  constructor(public api: ApiClient) {
    window.addEventListener('unhandledrejection', this.handleUnhandledExceptions)

    this.handleResize()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('beforeunload', this.canNavigate)

    this.history.restore()
    this.history.initWindowListeners()

    this.refreshPostSummaries().then()
    this.getMe().then()

    autorun(() => {
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
    if (e.reason instanceof ApiError) {
      e.preventDefault()
      return
    }
  }

  @action private handleResize = () => {
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight
  }

  canNavigate = (e?) => {
    if (this.unauthorized) return true
    if (this.post != null && this.post.isDirty()) {
      const msg = 'Post not saved yet. Do you really want to leave?'
      if (e != null) e.returnValue = msg
      if (confirm(msg)) {
        this.post = null
        return true
      }
      return false
    }
    return true
  }

  // TODO: Pretty intertwined with History...
  go = (f) => {
    if (this.history.ignoreNext) {
      this.history.ignoreNext = false
      this.history.unhandledPopstate = false
      return
    }
    if (!this.canNavigate()) {
      // Very important for following situation: User has unsaved changes and clicks on back button.
      // Without this, the history will be messed up (take it out and see the behavior for yourself)
      if (this.history.unhandledPopstate) {
        window.history.go(this.history.cursor - this.history.cursorNew)
        this.history.unhandledPopstate = false
        this.history.ignoreNext = true
      }
      return
    }
    this.history.handle(this.route)
    f()
  }

  @action goRouteNotFound = () => this.go(() => {
    this.route = new NotFoundRoute()
  })

  @action goLogin = () => this.go(() => {
    this.route = new LoginRoute()
  })

  @action goSearch = (search?: string) => this.go(async () => {
    const route = new SearchRoute(search)
    if (search == null) route.parseParams(window.location.search)
    this.route = route
    this.refreshPostSummaries().then()
  })

  @observable getPostRequest: RequestState
  @action goPost = (id: Id, title?: string) => this.go(async () => {
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
      if (this.getPostRequest.start > req.start) {
        console.log('Race condition prevented')
        return
      }
    } catch (e) {
      req.fail(e.message)
      if (this.getPostRequest.start > req.start) {
        console.log('Race condition prevented')
        return
      }
      if (!(e instanceof ApiError)) throw e
      if (e.statusCode !== 404) throw e
    }
    if (post) {
      route.title = post.title
    } else {
      route.notFound = true
    }
    this.post = post
  })

  @action goNewPost = () => this.go(async () => {
    this.post = new Post({title: ''})
    this.route = new NewPostRoute()
  })

  @observable loginRequest: RequestState
  @action login = (username: string, password: string) => this.go(async () => {
    this.loginRequest = new RequestState()
    try {
      await this.api.login(username, password)
      this.loginRequest.succeed()
      this.unauthorized = false
      this.getMe().then()
      this.goSearch()
    } catch (e) {
      this.loginRequest.fail(e.message)
      this.goLogin()
    }
  })

  @action logout = async () => {
    await this.api.logout()
    this.unauthorized = true
    this.clearCache()
    this.goLogin()
  }

  @action getMe = async () => {
    this.me = await this.api.getMe()
  }

  @observable getPostSummariesRequest: RequestState
  @action refreshPostSummaries = async () => {
    this.getPostSummariesRequest = new RequestState()
    try {
      const posts = await this.api.getPosts()
      runInAction(() => {
        this.getPostSummariesRequest.succeed()
        this.postSummariesInitialized = true
        this.postSummaries = posts
      })
    } catch (e) {
      this.getPostSummariesRequest.fail(e.message)
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

  @observable savePostRequest: RequestState
  @action saveCurrentPost = async () => {
    this.savePostRequest = new RequestState()
    try {
      if (this.post.id == null) {
        await this.addPost(this.post)
      } else {
        await this.savePost(this.post)
      }
      this.savePostRequest.succeed()
    } catch (e) {
      this.savePostRequest.fail(e.message)
      throw e
    }
  }

  @action resetCurrentPost = () => {
    if (this.route.name === 'new-post') {
      window.history.back()
    } else {
      this.post.reset()
    }
  }
}

export const uiStore = new UiStore(api)
api.onUnauthorized = () => {
  uiStore.unauthorized = true
  uiStore.goLogin()
}
