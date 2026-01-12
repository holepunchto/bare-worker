const Channel = require('bare-channel')
const MessageChannel = require('./message-channel')
const MessagePort = require('./message-port')

const state = Symbol.for('bare.worker.state')
const kind = Symbol.for('bare.worker.state.kind')

class WorkerState {
  static get [kind]() {
    return 0 // Compatibility version
  }

  constructor() {
    const { source, preloads, data, channel: handle } = Bare.Thread.self.data

    this.source = source
    this.preloads = preloads
    this.data = Bare.Thread.self.data = data

    const channel = Channel.from(handle, { interfaces: [MessagePort] })

    this.port = new MessagePort(channel)
    this.port._online()

    global[state] = this
  }

  get [kind]() {
    return WorkerState[kind]
  }

  get MessageChannel() {
    return MessageChannel
  }

  get MessagePort() {
    return MessagePort
  }
}

module.exports = exports = WorkerState

if (
  typeof global[state] === 'object' &&
  global[state] !== null &&
  global[state][kind] === WorkerState[kind]
) {
  exports.parent = global[state]
} else {
  exports.parent = null
}
