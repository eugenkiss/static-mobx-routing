import * as React from 'react'
import {Comp} from 'app/utils'
import {Route} from 'app/router'

export class Link extends Comp<{
  route: Route
  className?: string
  style?: Object
}> {
  handleClick = (e) => {
    if (e.button === 1 || e.metaKey || e.ctrlKey) return // Allow opening in new tab
    e.preventDefault()
    this.props.route.go()
  }

  render() {
    return (
      <a
        onClick={this.handleClick}
        href={this.props.route.path}
        className={this.props.className}
        style={this.props.style}
        >
        {this.props.children}
      </a>
    )
  }
}
