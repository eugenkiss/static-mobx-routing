import * as React from 'react'
import styled from 'styled-components'
import {Comp} from 'app/utils'
import {Sizes, Colors, FontWeights} from 'app/styles'

export enum ButtonState {
  normal,
  disabled,
  loading,
  successful,
  failed,
  locked
}

const Wrapper = styled.div`
  transition: all ease-in-out 0.1s;
  user-select: none;
  position: relative;
  display: inline-block;  
  padding: ${Sizes.xs} ${Sizes.m};
  letter-spacing: 1px;
  border: 2px solid rgba(0,0,0,0.1);
  border-radius: 2px;
  opacity: ${props => props.loading || props.locked ? '0.5' : '1.0'};
  background: ${({failed}) => {
    if (failed) return Colors.red
    return Colors.primary
  }}
  color: rgb(255,255,255);
  &:hover {
    cursor: ${props => props.disableCursor ? 'default' : 'pointer'};
  }
`

const Label = styled.div`
  opacity: ${props => props.hide ? '0.0' : '1.0'};
  font-size: 15px;
  font-weight: ${FontWeights.bold};
`

const Icon = styled.div`
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  text-align: center;
`

const Spinner = styled.div`
  position: relative;
  top: 10px;
  font-size: 12px;

  &:before {
    position: absolute;
    content: '';
    top: 50%;
    left: 50%;
    width: 1em;
    height: 1em;
    margin-top: -7px;
    margin-left: -7px;
    border-radius: 500rem;
    border: 0.2em solid;
    border-color: ${(props) => {
      if (props.highlighted) {
        if (props.primary) return 'rgba(255,255,255,0.4)'
      }
      return 'rgba(0,0,0,0.4)'
    }};
  }

  &:after {
    position: absolute;
    content: '';
    top: 50%;
    left: 50%;
    width: 1em;
    height: 1em;
    margin-top: -7px;
    margin-left: -7px;
    animation: spinner 0.6s linear;
    animation-iteration-count: infinite;
    border-radius: 500rem;
    border-color: #fff transparent transparent;
    border-style: solid;
    border-width: 0.2em;
  }
`

const MessageWrapper = styled.div`
  z-index: -1;
  position: absolute;
  top: 40px;
  left: 50%;
	width: 240px;
  margin-left: -120px;
`

const Message = styled.div`
  padding: ${Sizes.s};
	background: ${Colors.greyDark};
  border-radius: 2px;
	font-size: 12px;
	text-align: center;
	color: ${Colors.white};
	box-shadow: 0px 8px 8px rgba(0,0,0,0.1);

	&:before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    width: 0;
    margin-left: -2px;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid;
    border-bottom-color: ${Colors.greyDark};
	}
`

export class Button extends Comp<{
  icon?: string
  label?: string
  primary?: boolean
  highlighted?: boolean
  buttonState?: ButtonState
  message?: string
  tabIndex?: number
  onClick?()
}> {
  handleClick = () => {
    if (this.props.onClick == null || !this.canClick) return
    this.props.onClick()
  }

  handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    this.handleClick()
  }

  get isPrimary() { return this.props.primary }
  get isHighlighted() { return this.props.highlighted }
  get isLoading() { return this.props.buttonState === ButtonState.loading }
  get isDisabled() { return this.props.buttonState === ButtonState.disabled }
  get isLocked() { return this.props.buttonState === ButtonState.locked }
  get isSuccessful() { return this.props.buttonState === ButtonState.successful }
  get isFailed() { return this.props.buttonState === ButtonState.failed }

  get canClick() {
    return !(this.isLocked || this.isDisabled || this.isLoading || this.isSuccessful || this.isFailed)
  }

  render() {
    const tabIndex = this.props.tabIndex != null ? this.props.tabIndex : -1
    const hideLabel = this.isLoading || this.isSuccessful || this.isFailed
    const disableCursor = this.isDisabled || this.isLocked || this.isLoading || this.isSuccessful || this.isFailed
    return (
      <Wrapper
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
        tabIndex={tabIndex}
        disabled={this.isDisabled}
        loading={this.isLoading}
        locked={this.isLocked}
        successful={this.isSuccessful}
        failed={this.isFailed}
        disableCursor={disableCursor}
        >
        <Label hide={hideLabel}>
          {this.props.label}
        </Label>
        {(this.isLoading || this.isSuccessful || this.isFailed) &&
          <Icon
            successful={this.isSuccessful}
            failed={this.isFailed}
          >
            {this.isLoading && <Spinner primary={this.isPrimary} highlighted={this.isHighlighted} /> }
            {this.isSuccessful && <span>✔</span> }
            {this.isFailed && <span>x</span> }
          </Icon>
        }
        
        {this.props.message &&
          <MessageWrapper className="zoom-out-after-3s">
            <Message className="zoom-in">{this.props.message}</Message>
          </MessageWrapper>
        }
      </Wrapper>
    )
  }
}
