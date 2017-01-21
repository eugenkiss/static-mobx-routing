import {User} from 'app/models/user'
import {Post} from 'app/models/post'
import {fetch} from 'app/fetch'

export class ApiError {
  constructor(
    public statusCode: number,
    public error: string,
    public message: string) {}

  toJson(): any {
    const o: any = {}
    o.statusCode = this.statusCode
    o.error = this.error
    o.message = this.message
    return o
  }
}

export class ApiClient {

  onUnauthorized = () => {}

  host = undefined as string

  constructor(host?: string) {
    if (host) this.host = host
  }

  // TODO: Improve
  url = (endpoint: string, params?: Object) => {
    let url = this.host + endpoint
    if (!params) return url
    url += '?'
    for (const key of Object.keys(params)) {
      url += key + '=' + params[key].toString()
    }
    return url
  }

  call = async <T>(url: string, options: Object): Promise<T> => {
    const fetchOptions = Object.assign(options, {
      credentials: 'include',
    })
    let response
    try {
      response = await fetch(url, fetchOptions)
    } catch (e) {
      console.error(`NetworkError:\n${url}\n${JSON.stringify(options)}\n${e.message}`)
      throw new ApiError(-1, 'Network Error', e.message)
    }
    if (response.status == 401) {
      this.onUnauthorized()
    }
    const json: any = await response.json()
    if (json.error || !response.ok) {
      const apiError = new ApiError(response.status || -1, json.error, json.message)
      console.error(`ApiError:\n${url}\n${json.message}\n${JSON.stringify(options)}\n${JSON.stringify(apiError.toJson())}`)
      throw apiError
    }
    return json
  }

  get = <T>(endpoint: string, params?: Object): Promise<T> => {
    const url = this.url(endpoint, params)
    const options = {
      method: 'GET'
    }
    return this.call(url, options)
  }

  post = <T>(endpoint: string, body?: Object): Promise<T> => {
    const url = this.url(endpoint)
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }

    return this.call(url, options)
  }

  //noinspection JSUnusedGlobalSymbols
  postData = <T>(endpoint: string, body: any): Promise<T> => {
    const url = this.url(endpoint)
    const options = {
      method: 'POST',
      headers: {},
      body: body
    }
    return this.call(url, options)
  }

  //noinspection JSUnusedGlobalSymbols
  put = <T>(endpoint: string, body?: Object): Promise<T> => {
    const url = this.url(endpoint)
    const options = {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
    return this.call(url, options)
  }

  patch = <T>(endpoint: string, body?: Object): Promise<T> => {
    const url = this.url(endpoint)
    const options = {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
    return this.call(url, options)
  }

  //noinspection ReservedWordAsName,JSUnusedGlobalSymbols
  delete = <T>(endpoint: string, params?: Object): Promise<T> => {
    const url = this.url(endpoint, params)
    const options = {
      method: 'DELETE'
    }
    return this.call(url, options)
  }

  login = async (username: string, password: string): Promise<{}> => {
    return await this.post('/login', { username, password })
  }

  logout = async (): Promise<{}> => {
    return await this.post('/logout')
  }

  getMe = async (): Promise<User> => {
    return new User(await this.get('/me'))
  }

  getPosts = async (): Promise<Array<Post>> => {
    const s = await this.get<Array<any>>('/posts')
    return s.map(s => new Post(s))
  }

  getPost = async (id: string): Promise<Post> => {
    const s = await this.get(`/posts/${id}`)
    return new Post(s)
  }

  addPost = async (post: Post): Promise<Post> => {
    const s = await this.post(`/posts`, post.toApiJson())
    return new Post(s)
  }

  savePost = async (post: Post): Promise<Post> => {
    const s = await this.patch(`/posts/${post.id}`, post.toApiJson())
    return new Post(s)
  }
}

export const api = new ApiClient('mock://api')
