/* global Bare */
const Channel = require('bare-channel')
const MessageChannel = require('./lib/message-channel')
const MessagePort = require('./lib/message-port')
const constants = require('./lib/constants')
const { Thread } = Bare

module.exports = exports = class Worker extends MessagePort {
  constructor (filename, opts = {}) {
    const {
      channel = new Channel()
    } = opts

    super(channel, channel.connect())

    this._terminating = null

    this._thread = new Thread(require.resolve('./lib/thread'), {
      data: {
        channel: channel.handle,
        filename
      }
    })
  }

  terminate () {
    if (this._state & constants.state.EXITED) return

    if (this._terminating) return this._terminating

    this._state |= constants.state.TERMINATING
    this._terminating = this._terminate()

    return this._terminating
  }

  async _terminate () {
    await this._port.write({ type: constants.message.TERMINATE })
  }

  _ononline () {
    this._state |= constants.state.ONLINE
    this.emit('online')
  }

  async _onexit (exitCode) {
    await this._port.close()

    this._state |= constants.state.EXITED
    this.emit('exit', exitCode)
  }

  _onerror (err) {
    this.emit('error', err)
  }
}

exports.Worker = exports

exports.MessageChannel = MessageChannel
exports.MessagePort = MessagePort

exports.isMainThread = Thread.isMainThread

exports.parentPort = null
