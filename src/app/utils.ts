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

export class RequestState {
  start = now()
  @observable state: 'pending' | 'failed' | 'successful' = 'pending'
  error: string
  @action succeed() {
    this.state = 'successful'
  }
  @action fail(error: string) {
    this.error = error
    this.state = 'failed'
  }
  get pending() { return this.state === 'pending' }
  get failed() { return this.state === 'failed' }
  get successful() { return this.state === 'successful' }
}

// https://davidwalsh.name/javascript-polling
export function poll(fn, timeout, interval) {
    const endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 100;

    const checkCondition = function(resolve, reject) {
        // If the condition is met, we're done!
        const result = fn();
        if(result) {
            resolve(result);
        }
        // If the condition isn't met but the timeout hasn't elapsed, go again
        else if (Number(new Date()) < endTime) {
            setTimeout(checkCondition, interval, resolve, reject);
        }
        // Didn't match and too much time, reject!
        else {
            reject(new Error('timed out for ' + fn + ': ' + arguments));
        }
    };

    return new Promise(checkCondition);
}

export type ScrollInfo = {x: number, y: number, height: number}

export function getScrollInfo(): ScrollInfo {
  const b = document.body
  return { x: window.scrollX, y: window.scrollY, height: b.scrollHeight }
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
