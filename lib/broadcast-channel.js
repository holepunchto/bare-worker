const _BroadcastChannel = require('bare-broadcast-channel')
const { EventTarget } = require('bare-events/web')
const MessagePort = require('./message-port')
const MessageEvent = require('./message-event')

function noop() {}

module.exports = class BroadcastChannel extends EventTarget {
  static handles = new Map()

  constructor(name) {
    super()

    this._name = name
    this._port = new MessagePort(this._initChannel(name))

    this.onmessage = noop

    this._port.on('message', this._onmessage.bind(this))
  }

  get name() {
    return this._name
  }

  _initChannel(name) {
    let channel

    const { handles } = BroadcastChannel

    if (handles.has(name)) {
      channel = _BroadcastChannel.from(handles.get(name), { interfaces: [MessagePort] })
    } else {
      channel = new _BroadcastChannel({ interfaces: [MessagePort] })

      handles.set(name, channel.handle)
    }

    return channel
  }

  _onmessage(message) {
    const messageEvent = new MessageEvent('message', { data: message })

    this.dispatchEvent(messageEvent)
    this.onmessage(messageEvent)
  }

  postMessage(message) {
    this._port.postMessage(message)
  }

  ref() {
    this._port.ref()
  }

  unref() {
    this._port.unref()
  }

  close() {
    this._port.off('message', this._onmessage)

    this._port.close()
  }
}
