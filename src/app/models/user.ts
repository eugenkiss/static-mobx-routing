import {Id} from 'app/models/id'

export class User {
  id: Id
  name: string

  constructor(data) {
    this.fromJson(data)
  }

  fromJson(o): User {
    this.id = o.id
    this.name = o.name
    return this
  }
}
