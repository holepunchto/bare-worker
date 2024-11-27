/* global Bare */
const EventEmitter = require('bare-events')
const Channel = require('bare-channel')
const constants = require('./constants')
const errors = require('./errors')

module.exports = exports = class MessagePort extends EventEmitter {
  constructor(channel) {
    super()

    this._state = 0
    this._inflight = 0
    this._channel = channel
    this._port = null
    this._exitCode = 0

    this.on('newListener', this._onnewlistener).on(
      'removeListener',
      this._onremovelistener
    )
  }

  get detached() {
    return (this._state & constants.state.DETACHED) !== 0
  }

  start() {
    if (this._state & constants.state.STARTED) return

    this._state |= constants.state.STARTED

    this._port = this._channel.connect()

    if (this._state & constants.state.REFED) {
      this._port.ref()
    } else {
      this._port.unref()
    }

    this._port.on('close', this._onclose.bind(this))

    this._read()

    MessagePort._ports.add(this)
  }

  postMessage(message, transferList) {
    this._write(
      { type: constants.message.MESSAGE, value: message },
      { transfer: transferList }
    )
  }

  close() {
    this._close()
  }

  ref() {
    this._state |= constants.state.REFED
    this._ref()
  }

  unref() {
    this._state &= ~constants.state.REFED
    this._unref()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: MessagePort },

      detached: this.detached
    }
  }

  [Symbol.for('bare.detach')]() {
    if (this._state & constants.state.STARTED) {
      throw errors.ALREADY_STARTED(
        'Worker has already started receiving messages'
      )
    }

    this._state |= constants.state.DETACHED

    const handle = this._channel.handle

    this._channel = null

    return handle
  }

  static [Symbol.for('bare.attach')](handle) {
    return new MessagePort(Channel.from(handle, { interfaces: [MessagePort] }))
  }

  _close() {
    if (this._port === null) this.start()

    this._port.close()
  }

  _ref() {
    if (this._port === null) return

    if (this._inflight > 0 || (this._state & constants.state.REFED) !== 0) {
      this._port.ref()
    }
  }

  _unref() {
    if (this._port === null) return

    if (this._inflight === 0 && (this._state & constants.state.REFED) === 0) {
      this._port.unref()
    }
  }

  async _write(data, opts = {}) {
    if (this._port === null) this.start()

    this._inflight++
    this._ref()

    await this._port.write(data, opts)

    this._inflight--
    this._unref()
  }

  async _online() {
    if (this._state & constants.state.ONLINE) return

    this._state |= constants.state.ONLINE

    await this._write({ type: constants.message.ONLINE })
  }

  async _error(error) {
    await this._write({ type: constants.message.ERROR, error })
  }

  async _beforeExit(exitCode) {
    await this._write({ type: constants.message.BEFORE_EXIT, exitCode })
  }

  async _terminate() {
    if (this._state & constants.state.TERMINATING) return

    this._state |= constants.state.TERMINATING

    await this._write({ type: constants.message.TERMINATE })
  }

  async _read() {
    for await (const message of this._port) {
      switch (message.type) {
        case constants.message.MESSAGE:
          this._onmessage(message.value)
          break
        case constants.message.ONLINE:
          this._ononline()
          break
        case constants.message.ERROR:
          this._onerror(message.error)
          break
        case constants.message.BEFORE_EXIT:
          this._onbeforeexit(message.exitCode)
          break
        case constants.message.TERMINATE:
          this._onterminate()
      }
    }
  }

  _onnewlistener(name) {
    if (name !== 'message') return

    if (this.listenerCount('message') === 0) {
      this.start()
      this.ref()
    }
  }

  _onremovelistener(name) {
    if (name !== 'message') return

    if (this.listenerCount('message') === 0) this.unref()
  }

  _onclose() {
    MessagePort._ports.delete(this)

    this._state |= constants.state.CLOSED
    this.emit('close')
  }

  _onmessage(message) {
    this.emit('message', message)
  }

  _ononline() {
    this._state |= constants.state.ONLINE
    this.emit('online')
  }

  _onerror(err) {
    this._exitCode = 1
    this._terminate()
    this.emit('error', err)
  }

  _onbeforeexit(exitCode) {
    this._exitCode = exitCode
  }

  _onterminate() {
    Bare.exit()
  }

  static _ports = new Set()
}

Bare.on('beforeExit', (exitCode) => {
  for (const port of exports._ports) port._beforeExit(exitCode)
})
