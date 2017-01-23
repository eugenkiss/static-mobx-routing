import {Route, jsonToRoute} from 'app/router'
import {poll, sleep, ScrollInfo, getScrollInfo} from 'app/utils'
import {UiStore} from 'app/store'
import {observable} from 'mobx'

// Not happy with it.
export class History {
  @observable routes = new Array<Route>()
  scrollInfos = new Array<ScrollInfo>()
  @observable cursor = 0
  @observable cursorEnd = 0
  cursorNew = 0
  unhandledPopstate = false
  justLoaded = true
  ignoreNext = false

  constructor(private store: UiStore) {}

  initWindowListeners = () => {
    if ('scrollRestoration' in history) { history.scrollRestoration = 'manual' }
    window.addEventListener('popstate', this.handlePopstate)
    window.addEventListener('unload', this.handleUnload)
  }

  update = (cursor: number) => {
    this.cursor = Math.max(0, cursor)
    this.cursorEnd = this.cursor
    this.scrollInfos.length = this.cursorEnd + 1
    this.routes.length = this.cursorEnd + 1
  }

  private persist = () => {
    sessionStorage.setItem('routes', JSON.stringify(this.routes.map(r => r.toJson())))
    sessionStorage.setItem('scrollInfos', JSON.stringify(this.scrollInfos))
    sessionStorage.setItem('historyCur', JSON.stringify(this.cursor))
    sessionStorage.setItem('historyEnd', JSON.stringify(this.cursorEnd))
  }

  restore = () => {
    const routesJson = sessionStorage.getItem('routes')
    const scrollInfosJson = sessionStorage.getItem('scrollInfos')
    const historyCurJson = sessionStorage.getItem('historyCur')
    const historyEndJson = sessionStorage.getItem('historyEnd')
    if (routesJson == null || scrollInfosJson == null || historyCurJson == null || historyEndJson == null) return
    this.routes = JSON.parse(routesJson).map(o => o == null ? null : jsonToRoute(o))
    this.scrollInfos = JSON.parse(scrollInfosJson)
    this.cursor = JSON.parse(historyCurJson)
    this.cursorEnd = JSON.parse(historyEndJson)
    this.restoreScrollPosition().then()
  }

  private handleUnload = () => {
    this.scrollInfos[this.cursor] = getScrollInfo()
    this.routes[this.cursor] = this.store.route
    this.persist()
  }

  private handlePopstate = async (e) => {
    this.cursorNew = e.state || 0
    this.unhandledPopstate = true
  }

  private restoreScrollPosition = async () => {
    const info = this.scrollInfos[this.cursor]
    if (info == null) return
    await sleep(20) // Give React some time to update layout
    try {
      // See https://brigade.engineering/maintaining-scroll-positions-in-all-browsers-a280d49bffca
      await poll(() => document.body.scrollHeight >= info.height * 0.9, 2000, 20)
    } catch (e) { /* Don't care */ }
    window.scrollTo(info.x, info.y)
  }

  handle = (route: Route) => {
    this.scrollInfos[this.cursor] = getScrollInfo()
    this.routes[this.cursor] = route
    if (this.unhandledPopstate) {
      this.cursor = this.cursorNew
      this.restoreScrollPosition().then()
      this.unhandledPopstate = false
    } else if (this.justLoaded) {
      // Do nothing
      this.justLoaded = false
    } else {
      this.update(this.cursor + 1)
    }
  }
}
