const Thread = require('bare-thread')
const Channel = require('bare-channel')
const MessageChannel = require('./lib/message-channel')
const MessagePort = require('./lib/message-port')
const constants = require('./lib/constants')
const preloads = require('./lib/preloads')

const worker = Thread.prepare(require.resolve('./lib/worker-thread'))

module.exports = exports = class Worker extends MessagePort {
  constructor(entry, opts = {}) {
    const { workerData } = opts

    const channel = new Channel({ interfaces: [MessagePort] })

    super(channel)

    this._state = constants.state.REFED

    this._thread = new Thread(worker, {
      data: {
        source: Thread.prepare(entry),
        channel: channel.handle,
        workerData,
        preloads
      }
    })

    this._exitCode = 0
    this._terminating = null

    this.start()
  }

  terminate() {
    if (this._terminating !== null) return this._terminating.promise

    if (this._state & constants.state.CLOSED) {
      return Promise.resolve(this._exitCode)
    }

    this._terminating = Promise.withResolvers()
    this._terminate()

    return this._terminating.promise
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: Worker },

      detached: this.detached
    }
  }

  _onclose() {
    super._onclose()

    this._thread.join()

    if (this._terminating !== null) this._terminating.resolve(this._exitCode)

    this.emit('exit', this._exitCode)
  }
}

exports.Worker = exports

exports.MessageChannel = MessageChannel
exports.MessagePort = MessagePort

exports.isMainThread = Thread.isMainThread

exports.parentPort = null

exports.workerData = null

exports.preload = function preload(entry) {
  preloads.set(entry, Thread.prepare(entry))
}
