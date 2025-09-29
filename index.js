const Channel = require('bare-channel')
const MessageChannel = require('./lib/message-channel')
const MessagePort = require('./lib/message-port')
const constants = require('./lib/constants')
const { Thread } = Bare

module.exports = exports = class Worker extends MessagePort {
  constructor(filename, opts = {}) {
    const channel = new Channel({ interfaces: [MessagePort] })

    super(channel)

    this._state = constants.state.REFED

    this._thread = new Thread(require.resolve('./lib/worker-thread'), {
      data: {
        channel: channel.handle,
        filename,
        data: opts.workerData,
        imports: module.imports
      }
    })

    this._exitCode = 0
    this._terminating = null

    this.on('close', this._onexit).start()
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

  _onexit() {
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
