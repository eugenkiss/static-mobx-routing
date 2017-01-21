import * as React from 'react'
import Component = React.Component
import {observer} from 'mobx-react'
import {observable} from 'mobx'

// http://dev.edenspiekermann.com/2016/08/26/react-textarea-auto-resize/

@observer export class Textarea extends Component<any,any> {
  ghost = null
  @observable height = 20
  @observable value = ''

  componentWillReceiveProps(props) {
    setTimeout(this.setFilledTextareaHeight, 10)
  }

  componentDidMount() {
    this.setFilledTextareaHeight()
  }

  setFilledTextareaHeight = () => {
    if (this.ghost == null) return
    this.height = this.ghost.clientHeight
  }

  getExpandableField = () => {
    const { innerRef, ...rest } = this.props
    return (
      <div>
        <textarea
          {...rest}
          ref={innerRef}
          style={{
            height: this.height,
            width: '100%',
            overflow: 'hidden',
            border: 'none',
          }}
          onKeyUp={this.setFilledTextareaHeight}
        />
      </div>
    )
  }

  getGhostField = () => {
    return (
      <div
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          visibility: 'hidden',
          position: 'absolute',
          top: 0,
        }}
        ref={(c) => this.ghost = c}
        aria-hidden="true"
        >
        {this.props.value}
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.getExpandableField()}
        {this.getGhostField()}
      </div>
    )
  }
}
