import * as React from 'react'
import {observer} from 'mobx-react'
import styled from 'styled-components'
import {Comp, putBetween} from 'app/utils'
import {uiStore} from 'app/store'
import {Sizes, FontWeights, Colors} from 'app/styles'
import {Link} from 'app/comps/link'
import {PostRoute, SearchRoute, NewPostRoute} from 'app/router'
import {observable, autorunAsync} from 'mobx'
import {VSpace} from 'app/comps/basic'
import {Post} from 'app/models/post'

const SearchInput = styled.input`
  width: 100%;
  padding: ${Sizes.m} ${Sizes.s};
  border: 1px solid ${Colors.grey};
`

@observer export class Search extends Comp<{
  route: SearchRoute
}> {
  searchInput = null
  disposer = null
  // Debounced computed with initial value would be nice
  @observable filtered = this.filter(uiStore.postSummaries)
  @observable initialized = uiStore.postSummariesInitialized

  componentDidMount() {
    this.searchInput.focus()
    this.disposer = autorunAsync(() => {
      this.filtered = this.filter(uiStore.postSummaries)
      this.initialized = uiStore.postSummariesInitialized
    }, 150)
    document.body.scrollTop = 0 // No scroll restoration for now
  }

  componentWillUnmount() {
    this.disposer()
  }

  filter(allPosts: Array<Post>): Array<Post> {
    const searchText = this.props.route.search
    return !searchText
      ? allPosts
      : allPosts.filter(s => s.title.toLowerCase().indexOf(searchText.toLowerCase()) !== -1)
  }

  handleChange = (e) => {
    uiStore.goSearch(e.target.value)
  }

  renderInner() {
    if (!this.initialized) {
      if (uiStore.getPostSummariesRequest.status !== 'failed' || uiStore.postSummariesInitialized) {
        return <div>Loading</div>
      } else {
        return <div>Error loading posts. <Link route={this.props.route}>Retry</Link></div>
      }
    } else {
      const allPosts = uiStore.postSummaries
      const posts = this.filtered
      const createPost = <Link route={new NewPostRoute()}>Create a post!</Link>
      if (allPosts.length === 0) {
        return <div>There are no posts yet. {createPost}</div>
      } else if (posts.length === 0) {
        return <div>No matching post found. {createPost}</div>
      } else {
        return <Entries posts={posts}/>
      }
    }
  }

  render() {
    const searchText = this.props.route.search
    return (
      <div>
        <SearchInput
          type='text'
          innerRef={r => this.searchInput = r}
          placeholder='Type to search'
          onChange={this.handleChange}
          value={searchText}
        />
        <VSpace v={Sizes.l}/>
        {this.renderInner()}
      </div>
    )
  }
}

@observer class Entries extends Comp<{posts: Array<Post>}> {
  render() {
    return <div>{putBetween(this.props.posts,
      p => <Entry key={p.id} post={p}/>,
      p => <VSpace key={`${p.id}-space`} v={Sizes.m}/>
    )}</div>
  }
}

const EntryLink: typeof Link = styled(Link)`
  font-weight: ${FontWeights.bold};
  text-decoration: none;
  color: ${Colors.primary};
`

@observer class Entry extends Comp<{post: Post}> {
  render() {
    const p = this.props.post
    return (
      <div>
        <EntryLink route={new PostRoute(p.id, p.title)}>{p.title}</EntryLink>
      </div>
    )
  }
}
