const Thread = require('bare-thread')
const Channel = require('bare-channel')
const path = require('bare-path')
const os = require('bare-os')
const WorkerState = require('./lib/worker-state')
const MessageChannel = require('./lib/message-channel')
const MessagePort = require('./lib/message-port')
const constants = require('./lib/constants')

const preloads = new Map()

let environmentData = new Map()
let parentPort = null
let workerData = null

if (WorkerState.parent) {
  for (const [entry, source] of WorkerState.parent.preloads) {
    preloads.set(entry, source)
  }

  parentPort = WorkerState.parent.port
  workerData = WorkerState.parent.data
  environmentData = WorkerState.parent.environmentData
}

const worker = Thread.prepare(require.resolve('./lib/worker-thread'), { shared: true })

module.exports = exports = class Worker extends MessagePort {
  constructor(entry, opts = {}) {
    const { workerData } = opts

    const channel = new Channel({ interfaces: [MessagePort] })

    super(channel)

    this._state = constants.state.REFED

    const resolvedEntry = resolveEntry(entry)

    this._thread = new Thread(worker, {
      data: {
        source: Thread.prepare(resolvedEntry, { shared: true }),
        channel: channel.handle,
        data: workerData,
        preloads,
        environmentData
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

  async [Symbol.asyncDispose]() {
    await this.terminate()
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

exports.setEnvironmentData = function setEnvironmentData(key, value) {
  environmentData.set(key, value)
}

exports.getEnvironmentData = function getEnvironmentData(key) {
  return environmentData.get(key)
}

exports.Worker = exports

exports.MessageChannel = MessageChannel
exports.MessagePort = MessagePort

exports.parentPort = parentPort
exports.workerData = workerData

exports.isMainThread = Thread.isMainThread

exports.preload = function preload(entry) {
  const resolvedEntry = resolveEntry(entry)

  preloads.set(resolvedEntry, Thread.prepare(resolvedEntry, { shared: true }))
}

function resolveEntry(entry) {
  if (typeof entry !== 'string') return entry

  // Dot-relative filesystem paths should resolve from cwd.
  if (/^(?:\.{1,2}(?:[\\/]|$))/.test(entry)) return path.resolve(os.cwd(), entry)

  return entry
}
