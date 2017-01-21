import * as React from 'react'
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {Comp} from 'app/utils'
import {Colors, Sizes} from 'app/styles'
import {HSpace, VSpace} from './comps/basic'
import {observable} from 'mobx'

const keyVisible = 'devtools-visible'
const keyDelay = 'devtools-delay'
const keyVariance = 'devtools-variance'
const keyErrorProb = 'devtools-error-prob'

class DevToolsStore {
  @observable private _visible = JSON.parse(localStorage.getItem(keyVisible) || 'true')
  get visible() { return this._visible }
  set visible(v: boolean) { this._visible = v; localStorage.setItem(keyVisible, JSON.stringify(v)) }

  @observable private _delay = JSON.parse(localStorage.getItem(keyDelay) || '500')
  get delay() { return this._delay }
  set delay(v: number) { this._delay = v; localStorage.setItem(keyDelay, JSON.stringify(v)) }

  @observable private _variance = Number.parseFloat(localStorage.getItem(keyVariance) || '0.5')
  get variance() { return this._variance }
  set variance(v: number) { this._variance = v; localStorage.setItem(keyVariance, JSON.stringify(v)) }

  @observable private _errorProb = Number.parseFloat(localStorage.getItem(keyErrorProb) || '0.2')
  get errorProb() { return this._errorProb }
  set errorProb(v: number) { this._errorProb = v; localStorage.setItem(keyErrorProb, JSON.stringify(v)) }
}

export const devToolsStore = new DevToolsStore()

function formatStoMs(ms: number) {
  return (ms / 1000).toFixed(1) + 's'
}

const Wrapper = styled.div` 
  z-index: 99999;
  position: fixed;
  top: -1px;
  left: 20px;
  width: ${({visible}) => visible ? '150px' : 'initial'};
  padding: ${Sizes.xs};
  background: rgb(254, 254, 254);
  border: 1px solid rgb(230, 230, 230);
  font-size: ${Sizes.s};
`

const Entry = styled.div`
  display: flex;
  justify-items: center;
`

const Slider = styled.input`
  flex: 1 1 auto;
  width: 0;
  margin-top: -2px;
`

const Trigger = styled.div`
  text-decoration: underline;
  color: ${Colors.primary};
  cursor: pointer;
`

@observer export class DevTools extends Comp<{}> {
  render() {
    const s = devToolsStore
    return (
      <Wrapper visible={s.visible}>
        {s.visible &&
          <div>
            <Entry>
              <div>Delay: {formatStoMs(s.delay)}</div>
              <HSpace v={Sizes.s}/>
              <Slider
                type='range'
                max={2000}
                min={0}
                value={s.delay}
                onChange={e => s.delay = Number.parseInt(e.target.value)}
              />
            </Entry>
            <VSpace v={Sizes.s}/>
            <Entry>
              <div>Variance: {s.variance.toFixed(1)}</div>
              <HSpace v={Sizes.s}/>
              <Slider
                type='range'
                max={1}
                min={0}
                step={0.01}
                value={s.variance}
                onChange={e => s.variance = Number.parseFloat(e.target.value)}
              />
            </Entry>
            <VSpace v={Sizes.s}/>
            <Entry>
              <div>Err.Prob.: {s.errorProb.toFixed(1)}</div>
              <HSpace v={Sizes.s}/>
              <Slider
                type='range'
                max={1}
                min={0}
                step={'0.01'}
                value={s.errorProb}
                onChange={e => s.errorProb = Number.parseFloat(e.target.value)}
              />
            </Entry>
            <VSpace v={Sizes.s}/>
          </div>
        }
        <Trigger onClick={() => s.visible = !s.visible}>
          {s.visible ? 'Hide' : 'Show DevTools'}
        </Trigger>
      </Wrapper>
    )
  }
}
