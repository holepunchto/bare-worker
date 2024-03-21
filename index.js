/* global Bare */
const Channel = require('bare-channel')
const MessagePort = require('./lib/message-port')
const { Thread } = Bare

module.exports = exports = class Worker extends MessagePort {
  constructor (filename, opts = {}) {
    const {
      channel = new Channel()
    } = opts

    super(channel.connect())

    this._channel = channel

    this._thread = new Thread(require.resolve('./lib/thread'), {
      data: {
        channel: channel.handle,
        filename
      }
    })
  }
}

exports.Worker = exports

exports.isMainThread = Thread.isMainThread

exports.parentPort = null
