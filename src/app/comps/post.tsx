import * as React from 'react'
import {observer} from 'mobx-react'
import {VelocityTransitionGroup} from 'velocity-react'
import {Comp} from 'app/utils'
import {Colors, Sizes, FontWeights} from 'app/styles'
import {uiStore} from 'app/store'
import {autorun, computed} from 'mobx'
import {PostRoute, NewPostRoute} from 'app/router'
import styled from 'styled-components'
import {injectGlobal} from 'styled-components'
import {VSpace} from 'app/comps/basic'
import {Link} from 'app/comps/link'
import {Textarea} from 'app/comps/textarea'

const Title = styled.input`
  width: 100%;
  border: 0;
  outline: none;
  font-size: 38px;
  font-weight: ${FontWeights.heavy};
`

@observer export class PostComp extends Comp<{
  route: PostRoute | NewPostRoute
}> {
  titleRef = null
  editorRef = null
  autorunFocus = null
  autorunRestoreUiState = null
  lastPostId = null
  saveUiStateListener = null

  @computed get readOnly() { return this.props.route.name === 'post' && !uiStore.route.editing }

  @computed get dataState(): 'normal' | 'loading' | 'loadingWithCacheHit' | 'error' | 'notfound' {
    const route = this.props.route
    if (route.name === 'post') {
      if (route.notFound) return 'notfound'
      if (!route.cacheHit && uiStore.getPostRequest.failed) return 'error'
      if (route.cacheHit && uiStore.getPostRequest.pending) return 'loadingWithCacheHit'
      if (uiStore.getPostRequest.pending || uiStore.post == null) return 'loading'
    }
    return 'normal'
  }

  componentDidMount() {
    this.autorunFocus = autorun(() => {
      if (uiStore.route.name === 'new-post' && this.titleRef != null) this.titleRef.focus()
      if (uiStore.route.name === 'post' && this.editorRef != null) this.editorRef.blur()
    })
    this.saveUiStateListener = uiStore.history.addSaveUiStateListener(route => {
      if (route.name !== 'post') return
      console.log('store scroll position', document.body.scrollTop)
      return { name: 'PostComp', data: { scrollY: document.body.scrollTop }}
    })

    this.autorunRestoreUiState = autorun(() => {
      if ((this.dataState === 'normal' || this.dataState === 'loadingWithCacheHit') && this.lastPostId !== uiStore.post.id) {
        this.lastPostId = uiStore.post.id
        if (uiStore.history.uiState == null || uiStore.history.uiState['PostComp'] == null) return
        const y = uiStore.history.uiState['PostComp'].scrollY
        console.log('restore scroll position', y)
        // TODO: Why is delay needed? And why is scroll position not restored exactly when at the very bottom?
        requestAnimationFrame(() => document.body.scrollTop = y)
      }
    })
  }

  componentWillUnmount() {
    this.autorunFocus()
    this.autorunRestoreUiState()
    uiStore.history.removeSaveUiStateListener(this.saveUiStateListener)
  }

  handleTitleKeyDown = (e) => {
    if (e.key == 'Enter' || e.key == 'Tab' || e.key == 'ArrowDown') {
      e.preventDefault()
      this.editorRef.focus()
    }
  }

  renderInner() {
    const route = this.props.route
    const post = uiStore.post
    const contentPlaceholder = uiStore.route.name === 'new-post' ? 'Add content' : ''
    const content = post && post.text ? post.text : ''
    if (this.dataState === 'notfound') {
      return <div>Post not found</div>
    }
    if (this.dataState === 'error') {
      return <div>Error getting post. <Link route={route}>Retry</Link></div>
    }
    return (
      <Textarea
        innerRef={r => this.editorRef = r}
        readOnly={this.readOnly}
        placeholder={contentPlaceholder}
        value={content}
        onChange={(e: any) => post.text = e.target.value}
      />
    )
  }

  render() {
    const route = this.props.route
    const post = uiStore.post
    const titlePlaceholder = uiStore.route.name === 'new-post' ? 'Post Title' : ''
    const title = post != null ? post.title : route.name === 'post' ? route.title : ''
    const cacheHit = route.name === 'post' && route.cacheHit // Prevent flickering
    const skeleton = this.dataState === 'loading'
    const showTitle = !(route.name === 'post' && !title)
    return (
      <div style={{ position: 'relative', width: '100%'}}> { /* A pity it seems hard to create a StackLayout */ }
        <div style={{ position: 'absolute', width: '100%'}}>
          {showTitle &&
            <Title
              innerRef={r => this.titleRef = r}
              type='text'
              value={title}
              readOnly={this.readOnly}
              placeholder={titlePlaceholder}
              onChange={(e: any) => post.title = e.target.value}
              onKeyDown={this.handleTitleKeyDown}
            />
          }
          <VSpace v={Sizes.l}/>
          {this.renderInner()}
        </div>
        {!cacheHit &&
          <VelocityTransitionGroup leave={{animation: 'fadeOut', duration: 70}}>
            {skeleton && <Skeleton initialTitle={title}/>}
          </VelocityTransitionGroup>
        }
      </div>
    )
  }
}

class Skeleton extends Comp<{
  initialTitle: string
}> {
  title: string

  constructor(props) {
    super(props)
    this.title = props.initialTitle
  }

  render() {
    const title = this.title
    const lines = []
    const len = uiStore.windowHeight / 45
    for (let i = 0; i < len; i++) {
      lines.push(
        <div
          key={i}
          style={{
            background: Colors.greyLight,
            width: `${100 - (Math.random() * 10)}%`,
            height: '14px',
            marginBottom: '1em',
            opacity: 1 - (i/len),
          }}
        />
      )
    }
    return (
      <div style={{width: '100%', position: 'absolute'}}>
        {title ? (
          <Title
            type='text'
            value={title}
            readOnly
          />
        ) : (
          <div
            style={{
              background: Colors.greyLight,
              width: '40%',
              height: '40px',
              marginTop: '0.4em',
            }}
          />
        )}
        <VSpace v={Sizes.l}/>
        {lines}
      </div>
    )
  }
}
