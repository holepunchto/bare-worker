const Channel = require('bare-channel')
const MessagePort = require('./message-port')
const BroadcastChannel = require('./broadcast-channel')

const state = Symbol.for('bare.worker.state')
const kind = Symbol.for('bare.worker.state.kind')

module.exports = class WorkerState {
  static get [kind]() {
    return 0 // Compatibility version
  }

  static get parent() {
    const parent = global[state]

    if (typeof parent === 'object' && parent !== null && parent[kind] === WorkerState[kind]) {
      return parent
    }

    return null
  }

  constructor() {
    const {
      source,
      preloads,
      data,
      environmentData,
      channel: handle,
      broadcastChannelHandles
    } = Bare.Thread.self.data

    this.source = source
    this.preloads = preloads
    this.data = Bare.Thread.self.data = data
    this.environmentData = environmentData

    const channel = Channel.from(handle, { interfaces: [MessagePort] })

    this.port = new MessagePort(channel)
    this.port._online()

    BroadcastChannel.handles = broadcastChannelHandles

    global[state] = this
  }

  get [kind]() {
    return WorkerState[kind]
  }
}
