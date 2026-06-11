const { Event } = require('bare-events/web')

// https://html.spec.whatwg.org/multipage/comms.html#messageevent
module.exports = class MessageEvent extends Event {
  constructor(type, opts) {
    super(type, opts)

    const { data, ports = [] } = opts

    this._data = data
    this._ports = ports
  }

  get data() {
    return this._data
  }

  get ports() {
    return this._ports
  }
}
