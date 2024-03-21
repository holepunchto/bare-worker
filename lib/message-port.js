const EventEmitter = require('bare-events')
const constants = require('./constants')

module.exports = class MessagePort extends EventEmitter {
  constructor (port) {
    super()

    this._port = port
    this._port.on('close', this._onclose.bind(this))

    this._read()
  }

  _onclose () {
    this.emit('close')
  }

  async _read () {
    for await (const message of this._port) {
      switch (message.type) {
        case constants.message.MESSAGE:
          this.emit('message', message.value)
          break
        case constants.message.EXIT:
          await this._port.close()
          this.emit('exit', message.exitCode)
          break
        case constants.message.ERROR:
          this.emit('error', message.error)
          break
      }
    }
  }

  postMessage (message, transferList) {
    this._port.write({ type: constants.message.MESSAGE, value: message }, { transfer: transferList })
  }
}
