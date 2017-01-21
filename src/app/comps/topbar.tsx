import * as React from 'react'
import {Comp, sleep, sleepMin} from 'app/utils'
import {Sizes} from 'app/styles'
import styled from 'styled-components'
import {uiStore} from 'app/store'
import {SearchRoute, NewPostRoute} from 'app/router'
import {Button, ButtonState} from 'app/comps/button'
import {HSpace, Flex, Box} from 'app/comps/basic'
import {Link} from 'app/comps/link'
import {observer} from 'mobx-react'
import {action, reaction, observable} from 'mobx'

const Background = styled.div`
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  height: 60px;
  background: rgb(245,245,245);
  border-bottom: 1px solid #ddd;
`

const ActiveArea = styled.div`
  width: 800px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
`

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
      <Background>
        <ActiveArea>
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
        </ActiveArea>
      </Background>
    )
  }
}

@observer export class SavePostButtonGroup extends Comp<{}> {
  @observable buttonState = ButtonState.normal
  @observable message = ''
  disposer = null

  componentDidMount() {
    document.addEventListener("keydown", this.handleSaveShortcut, false)
    this.disposer = reaction(() => uiStore.savePostRequest && uiStore.savePostRequest.state, async () => {
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
