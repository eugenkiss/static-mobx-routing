import {observable} from 'mobx'
import {Id} from 'app/models/id'

export class Post {
  id: Id
  @observable title: string
  @observable text: string

  constructor(data) {
    this.fromJson(data)
  }

  fromJson(o: any): Post {
    this.id = o.id
    this.title = o.title
    this.titleOrig = this.title
    this.text = o.text
    this.textOrig = this.text
    return this
  }

  toApiJson = (): any => {
    const o: any = {}
    if (this.id != null) o.id = this.id
    o.title = this.title
    o.text = this.text
    return o
  }

  private titleOrig: string
  private textOrig: string

  isDirty = () => {
    return (
      this.title !== this.titleOrig ||
      this.text !== this.textOrig ||
      false
    )
  }

  reset = () => {
    this.title = this.titleOrig
    this.text = this.textOrig
  }
}
