const Channel = require('bare-channel')
const Broadcast = require('bare-broadcast-channel')
const MessagePort = require('./message-port')

const state = Symbol.for('bare.worker.state')
const kind = Symbol.for('bare.worker.state.kind')

module.exports = class WorkerState {
  static get [kind]() {
    return 1 // Compatibility version
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
      entry,
      argv,
      environmentData,
      channel: handle,
      broadcast: broadcastHandle
    } = Bare.Thread.self.data

    this.source = source
    this.preloads = preloads
    this.data = Bare.Thread.self.data = data
    this.entry = entry
    this.argv = argv
    this.environmentData = environmentData
    this.broadcast = Broadcast.from(broadcastHandle)

    const channel = Channel.from(handle, { interfaces: [MessagePort] })

    this.port = new MessagePort(channel)
    this.port._online()

    global[state] = this
  }

  get [kind]() {
    return WorkerState[kind]
  }
}
