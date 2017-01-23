import * as React from 'react'
import styled from 'styled-components'
import {FieldState, FormState} from 'formstate'
import {action, observable, autorun, reaction} from 'mobx'
import {observer} from 'mobx-react'
import {Button, ButtonState} from 'app/comps/button'
import {Comp, sleepMin} from 'app/utils'
import {uiStore} from 'app/store'
import {Sizes, Colors} from 'app/styles'
import {Flex, VSpace} from 'app/comps/basic'

class LoginState {
  dispose = null
  constructor() {
    this.dispose = autorun(() => {
      if (uiStore.loginRequest && uiStore.loginRequest.failed) {
        this.errorMessage = uiStore.loginRequest.error
      }
    })
  }
  username = new FieldState({ value: '' }).validators(val => !val && 'username required')
  password = new FieldState({ value: '' }).validators(val => !val && 'password required')
  @observable errorMessage: string = ''
  form = new FormState({
    username: this.username,
    password: this.password,
  })
  @action onSubmit = async (e?) => {
    if (e) e.preventDefault()
    const res = await this.form.validate()
    if (res.hasError) {
      this.errorMessage = this.form.error
      return
    }
    this.errorMessage = ''
    await uiStore.login(this.username.$, this.password.$)
  }
}

const Wrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  marginLeft: -150px;
`

const Input = styled.input`
  width: 100%;
  padding: ${Sizes.s} ${Sizes.s};
  border: 1px solid ${Colors.grey};
`

const Hint = styled.p`
  color: ${Colors.grey};
`

const ErrorMessage = styled.div`
  color: ${Colors.red};
`

@observer export class Login extends Comp<{
}> {
  disposer = null
  formState = new LoginState()
  @observable buttonState = ButtonState.normal

  componentDidMount() {
    this.disposer = reaction(() => uiStore.loginRequest && uiStore.loginRequest.status, async () => {
      const req = uiStore.loginRequest
      if (req.pending) {
        this.buttonState = ButtonState.loading
      } else {
        await sleepMin(req.start, 500)
        this.buttonState = ButtonState.normal
      }
    })
  }

  componentWillUnmount() {
    this.disposer()
    this.formState.dispose()
  }

  handleSearchRef = ref => {
    if (ref != null) ref.focus()
  }

  render() {
    const form = this.formState
    return (
      <Wrapper >
        <form onSubmit={form.onSubmit}>
          <Flex column>
            <Input
              innerRef={this.handleSearchRef}
              tabIndex={0}
              type='text'
              value={form.username.value}
              placeholder='Username'
              onChange={e => form.username.onChange(e.target.value)}
            />
            <VSpace v={Sizes.s}/>
            <Input
              tabIndex={0}
              type='password'
              value={form.password.value}
              placeholder='Password'
              onChange={e => form.password.onChange(e.target.value)}
            />
            <VSpace v={Sizes.s}/>
            <div>
              <Button
                tabIndex={0}
                label='Login'
                buttonState={this.buttonState}
                onClick={form.onSubmit}
              />
            </div>
            {form.errorMessage &&
              <div>
                <VSpace v={Sizes.s}/>
                <ErrorMessage>{form.errorMessage}</ErrorMessage>
              </div>
            }
            <Hint>Hint: admin / admin</Hint>
            <input type='submit' tabIndex={-1} style={{display: 'none'}}/>
          </Flex>
        </form>
      </Wrapper>
    )
  }
}
