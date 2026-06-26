const { Duplex } = require('bare-stream')
const constants = require('./constants')

module.exports = class IPC extends Duplex {
  constructor(port) {
    super()

    this._port = port
    this._state = 0

    this.on('newListener', this._onnewlistener).on('removeListener', this._onremovelistener)
  }

  async _write(chunk, encoding, cb) {
    let err = null

    try {
      await this._port._write({ type: constants.message.IPC_DATA, value: chunk })
    } catch (e) {
      err = e
    }

    cb(err)
  }

  async _final(cb) {
    let err = null

    try {
      await this._port._write({ type: constants.message.IPC_END })
    } catch (e) {
      err = e
    }

    cb(err)
  }

  _destroy(err, cb) {
    if (this._state & constants.state.REFED) {
      this._state &= ~constants.state.REFED
      this._port._unref()
    }

    cb(err)
  }

  _consumers() {
    return this.listenerCount('data') + this.listenerCount('readable')
  }

  _onnewlistener(name) {
    if (name !== 'data' && name !== 'readable') return

    if (this._consumers() === 0) {
      this._state |= constants.state.REFED
      this._port.start()
      this._port._ref()
    }
  }

  _onremovelistener(name) {
    if (name !== 'data' && name !== 'readable') return

    if (this._consumers() === 0) {
      this._state &= ~constants.state.REFED
      this._port._unref()
    }
  }
}
