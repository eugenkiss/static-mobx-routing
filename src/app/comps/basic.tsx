import * as React from 'react'
import {Comp} from 'app/utils'

// Sometimes it's overkill to create a named component (a la styled-components) purely
// for layouting needs. Having a generic helper component that is notationally nicer to use than going with
// <div style={{...}}/> is convenient. Plus, inline styles make more sense here as, in principle, the combination
// of different values would lead to many generated classes which seems unnecessary.
// Why not stateless components? Because they will have the unhelpful name 'StatelessComponent' in developer view.

export class HSpace extends Comp<{v: string}> {
  render() { return <div style={{ marginRight: this.props.v }}/> }
}
export class VSpace extends Comp<{v: string}> {
  render() { return <div style={{ marginBottom: this.props.v }}/> }
}

export class Flex extends Comp<{
  align?: string
  justify?: string
  wrap?: boolean
  column?: boolean
  auto?: boolean
}> {
  render() {
    const {children, align, justify, wrap, column, auto} = this.props
    const s: any = {display: 'flex'}
    if (align != null) s['alignItems'] = align
    if (justify != null) s['justifyContent'] = justify
    if (wrap) s['flexWrap'] = 'wrap'
    if (column) s['flexDirection'] = 'column'
    if (auto) s['flex'] = '1 1 auto'
    return <div style={s}>{children}</div>
  }
}
export class Box extends Comp<{
  align?: string
  justify?: string
  wrap?: boolean
  column?: boolean
  auto?: boolean
}> {
  render() {
    const {children, align, justify, wrap, column, auto} = this.props
    const s: any = {}
    if (align != null) s['alignItems'] = align
    if (justify != null) s['justifyContent'] = justify
    if (wrap) s['flexWrap'] = 'wrap'
    if (column) s['flexDirection'] = 'column'
    if (auto) s['flex'] = '1 1 auto'
    return <div style={s}>{children}</div>
  }
}
