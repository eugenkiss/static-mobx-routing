import * as React from 'react'
import {Comp, sleep, sleepMin} from 'app/utils'
import {Sizes, Colors} from 'app/styles'
import styled from 'styled-components'
import {uiStore} from 'app/store'
import {SearchRoute, NewPostRoute} from 'app/router'
import {Button, ButtonState} from 'app/comps/button'
import {HSpace, Flex, Box} from 'app/comps/basic'
import {Link} from 'app/comps/link'
import {observer} from 'mobx-react'
import {action, reaction, observable} from 'mobx'

const FixedContainer = styled.div`
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  right: 0;
  margin-bottom: 1em;
`

const MainBackground = styled.div`
  width: 100%;
  height: 60px;
  background: rgb(245,245,245);
  border-bottom: 1px solid #ddd;
`

const MainArea = styled.div`
  width: 800px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
`

const HistoryBackground = styled.div`
  width: 100%;
  height: 20px;
  background: rgb(250,250,250);
  border-bottom: 1px solid #ddd;
`

const HistoryArea = styled.div`
  width: 800px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  font-size: ${Sizes.s};
`

const HistoryEntry = styled.div`
  color: ${props => props.color || 'initial'};
  cursor: pointer;
`

@observer class History extends Comp<{}> {
  render() {
    const routes = uiStore.history.routes
    const routeComps = []
    const cursor = uiStore.history.cursor
    const end = uiStore.history.routes.length
    for (let i = 0; i < end; i++) {
      const route = routes[i]
      if (route == null) continue
      const color = i < cursor ? null : i === cursor ? Colors.primary : Colors.greyTextLight
      routeComps.push(
        <HistoryEntry key={i} color={color} onClick={() => uiStore.history.goToIndex(i)}>
          {route.name}
        </HistoryEntry>
      )
      if (i < end - 1) routeComps.push(<div key={`${i}-sep`}>&nbsp;{'>'}&nbsp;</div>)
    }
    return (
      <Flex>
        {routeComps}
      </Flex>
    )
  }
}

@observer class CurrentHistoryEntry extends Comp<{}> {
  render() {
    return (
      <div>
        {JSON.stringify(uiStore.route.toJson(), null, 2)}
      </div>
    )
  }
}

@observer export class Topbar extends Comp<{}> {
  handleEdit = () => {
    if (uiStore.route.name !== 'post') return
    uiStore.route.editing = true
  }

  render() {
    const showEditingActions = uiStore.route.name === 'new-post'
      || (uiStore.route.name === 'post' && uiStore.route.editing)
    const showEditButton = uiStore.route.name === 'post' && !uiStore.route.editing && uiStore.post != null
    return (
      <FixedContainer>
        <MainBackground>
          <MainArea>
            <Link route={new SearchRoute()}>
              <Button label='Home'/>
            </Link>
            <HSpace key='space' v={Sizes.xs} />
            {!showEditingActions &&
              <Flex>
                <Link route={new NewPostRoute()}><Button label='New Post'/></Link>
                <HSpace v={Sizes.xs} />
                {showEditButton && <Button primary label='Edit' onClick={this.handleEdit}/>}
              </Flex>
            }
            {showEditingActions && <SavePostButtonGroup/>}
            <Box auto/>
            <Button label={`Logout${uiStore.me ? ' ' + uiStore.me.name : ''}`} onClick={() => uiStore.logout()}/>
          </MainArea>
        </MainBackground>
        <HistoryBackground>
          <HistoryArea>
            <History/>
          </HistoryArea>
        </HistoryBackground>
        <HistoryBackground>
          <HistoryArea>
            <CurrentHistoryEntry/>
          </HistoryArea>
        </HistoryBackground>
      </FixedContainer>
    )
  }
}

@observer export class SavePostButtonGroup extends Comp<{}> {
  @observable buttonState = ButtonState.normal
  @observable message = ''
  disposer = null

  componentDidMount() {
    document.addEventListener("keydown", this.handleSaveShortcut, false)
    this.disposer = reaction(() => uiStore.savePostRequest && uiStore.savePostRequest.status, async () => {
      const req = uiStore.savePostRequest
      if (req.pending) {
        if (uiStore.route.name === 'post') uiStore.route.editing = true
        this.buttonState = ButtonState.loading
      }
      if (req.successful) {
        await sleepMin(req.start, 500)
        this.buttonState = ButtonState.successful
        await sleep(1500)
        this.buttonState = ButtonState.normal
        if (uiStore.route.name === 'post') uiStore.route.editing = false
      }
      if (req.failed) {
        await sleepMin(req.start, 500)
        this.buttonState = ButtonState.failed
        this.message = req.error
        await sleep(1500)
        this.buttonState = ButtonState.normal
        this.message = null
      }
    })
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleSaveShortcut)
    this.disposer()
  }

  handleSaveShortcut = (e) => {
    if ((window.navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey) && e.keyCode == 83) {
      e.preventDefault()
      this.handleSave()
    }
  }

  @action handleSave = () => {
    uiStore.saveCurrentPost().then()
  }

  @action handleDiscard = () => {
    if (uiStore.route.name === 'post') uiStore.route.editing = false
    uiStore.resetCurrentPost()
  }

  render() {
    const cancelButtonState = this.buttonState !== ButtonState.normal ? ButtonState.locked : ButtonState.normal
    return (
      <Flex>
        <Button
          label='Save'
          onClick={this.handleSave}
          buttonState={this.buttonState}
          message={this.message}
        />
        <HSpace v={Sizes.xs} />
        <Button
          label={'Discard'}
          onClick={this.handleDiscard}
          buttonState={cancelButtonState}
        />
      </Flex>
    )
  }
}
