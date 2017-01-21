import * as React from 'react'
import styled from 'styled-components'
import {observer} from 'mobx-react'
import {Comp} from 'app/utils'
import {uiStore} from 'app/store'
import {Topbar} from 'app/comps/topbar'

const Wrapper = styled.div` 
  position: absolute;
  top: 100px;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
`

const Container = styled.div`
  width: 800px;
  margin: 0 150px;
`

@observer export class App extends Comp<{}> {
  render() {
    if (uiStore.route.name === 'login') return uiStore.route.comp
    if (uiStore.route.name === 'notfound') return uiStore.route.comp
    return (
      <div>
        <Topbar/>
        <Wrapper>
          <Container>
            {uiStore.route.comp}
          </Container>
        </Wrapper>
      </div>
    )
  }
}
