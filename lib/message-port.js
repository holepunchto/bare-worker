const EventEmitter = require('bare-events')
const constants = require('./constants')

module.exports = class MessagePort extends EventEmitter {
  constructor (channel, port = null) {
    super()

    this._state = 0

    this._channel = channel
    this._port = port

    if (this._port!== null) this.start()
  }

  start () {
    if (this._state & constants.state.STARTED) return

    this._state |= constants.state.STARTED

    if (this._port === null) this._port = this._channel.connect()

    this._port.on('close', this._onclose.bind(this))

    this._read()
  }

  postMessage (message, transferList) {
    this._port.write({ type: constants.message.MESSAGE, value: message }, { transfer: transferList })
  }

  async close () {
    await this._port.close()
  }

  _onclose () {
    this.emit('close')
  }

  _onmessage (message) {
    this.emit('message', message)
  }

  _ononline () {}
  _onexit () {}
  _onerror () {}

  async _onterminate () {
    await this._port.close()

    Bare.exit()
  }

  async _read () {
    for await (const message of this._port) {
      switch (message.type) {
        case constants.message.MESSAGE:
          this._onmessage(message.value)
          break
        case constants.message.ONLINE:
          this._ononline()
          break
        case constants.message.EXIT:
          this._onexit(message.exitCode)
          break
        case constants.message.ERROR:
          this._onerror(message.error)
          break
        case constants.message.TERMINATE:
          this._onterminate()
      }
    }
  }
}
