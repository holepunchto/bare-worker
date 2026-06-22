const EventEmitter = require('bare-events')
const errors = require('./errors')

module.exports = exports = class BroadcastChannel extends EventEmitter {
  constructor(name) {
    super()

    this.name = String(name)

    this._port = exports._channel.connect()
    this._inflight = 0
    this._closed = false

    // An idle channel without listeners should not hold the thread alive.
    this._port.unref()

    this.on('newListener', this._onnewlistener).on('removeListener', this._onremovelistener)

    this._read()
  }

  postMessage(message) {
    if (this._closed) {
      throw errors.CHANNEL_CLOSED('BroadcastChannel is closed')
    }

    this._write(message)
  }

  close() {
    if (this._closed) return

    this._closed = true

    this._port.close()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: BroadcastChannel },

      name: this.name
    }
  }

  async _write(message) {
    this._inflight++
    this._port.ref()

    try {
      await this._port.write({ name: this.name, message })
    } finally {
      this._inflight--
      this._unref()
    }
  }

  _unref() {
    if (this._inflight === 0 && this.listenerCount('message') === 0) this._port.unref()
  }

  async _read() {
    for await (const data of this._port) {
      // The channel shares a single underlying broadcast channel across the
      // whole worker tree, so messages are tagged with their channel name and
      // filtered on read.
      if (data.name === this.name) this.emit('message', data.message)
    }
  }

  _onnewlistener(name) {
    if (name !== 'message') return

    if (this.listenerCount('message') === 0) this._port.ref()
  }

  _onremovelistener(name) {
    if (name !== 'message') return

    if (this.listenerCount('message') === 0) this._unref()
  }

  // The underlying broadcast channel shared by every named channel on this
  // thread. Set when the worker module is loaded.
  static _channel = null
}
