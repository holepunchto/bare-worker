const Channel = require('bare-channel')

const state = Symbol.for('bare.worker.state')
const kind = Symbol.for('bare.worker.state.kind')

class WorkerState {
  static get [kind]() {
    return 0 // Compatibility version
  }

  static get parent() {
    const parent = global[state]

    if (
      typeof parent === 'object' &&
      parent !== null &&
      parent[kind] === WorkerState[kind]
    ) {
      return parent
    }

    return null
  }

  constructor() {
    this._MessageChannel = require('./message-channel')
    this._MessagePort = require('./message-port')

    const { source, preloads, data, environmentData, channel: handle } = Bare.Thread.self.data

    this.source = source
    this.preloads = preloads
    this.data = Bare.Thread.self.data = data
    this.environmentData = environmentData

    const channel = Channel.from(handle, { interfaces: [this._MessagePort] })

    this.port = new this._MessagePort(channel)
    this.port._online()

    global[state] = this
  }

  get [kind]() {
    return WorkerState[kind]
  }

  get MessageChannel() {
    return this._MessageChannel
  }

  get MessagePort() {
    return this._MessagePort
  }
}

module.exports = WorkerState
