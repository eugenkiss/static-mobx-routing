import * as React from 'react'
import {observable, action} from 'mobx'

export class Comp<T> extends React.Component<T, {}> { }

export function now() {
  return new Date().getTime()
}

export function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

export function sleepMin(start, minSleep) {
  return new Promise(resolve => {
    const end = (new Date()).getTime()
    const duration = end - start
    if (duration >= minSleep) return resolve()
    setTimeout(resolve, minSleep - duration)
  })
}

type RequestStatus = 'null' | 'pending' | 'failed' | 'successful'
export class RequestState {
  start = now()
  @observable status: RequestStatus
  error: string
  constructor(state?: RequestStatus) {
    this.status = state != null ? state : 'pending'
  }
  @action succeed() {
    this.status = 'successful'
  }
  @action fail(error: string) {
    this.error = error
    this.status = 'failed'
  }
  get pending() { return this.status === 'pending' }
  get failed() { return this.status === 'failed' }
  get successful() { return this.status === 'successful' }
}

// Not perfect but good enough
// http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object/1714899#comment65133831_35416293
export function mapToQueryString(map) {
  let result = []
  for (let [k, v] of map.entries()) {
    if (v == null || v === '') continue
    result.push(`${encodeURIComponent(k)}=${encodeURIComponent(v.toString())}`)
  }
  return result.join('&')
}

// http://stackoverflow.com/a/979997/283607
export function gup(name, url) {
  if (!url) url = location.href;
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  const regexS = "[\\?&]"+name+"=([^&#]*)";
  const regex = new RegExp( regexS );
  const results = regex.exec( url );
  return results == null ? null : results[1];
}

export function putBetween<T>(xs: Array<T>, main: (T) => any, inter: (T) => any): Array<any> {
  const result = []
  for (let i = 0; i < xs.length; i++) {
    result.push(main(xs[i]))
    if (i < xs.length - 1) result.push(inter(xs[i]))
  }
  return result
}
