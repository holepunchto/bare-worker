/* global Bare */
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
        data: opts.workerData
      }
    })

    this.start()
  }

  terminate() {
    this._terminate()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: Worker },

      detached: this.detached
    }
  }

  async _ononline() {
    await super._ononline()

    this.emit('online')
  }

  async _onexit(exitCode) {
    await super._onexit()

    this._thread.join()

    this.emit('exit', exitCode)
  }

  async _onerror(err) {
    await super._onerror()

    this.emit('error', err)
  }
}

exports.Worker = exports

exports.MessageChannel = MessageChannel
exports.MessagePort = MessagePort

exports.isMainThread = Thread.isMainThread

exports.parentPort = null

exports.workerData = null
