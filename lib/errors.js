module.exports = class WorkerError extends Error {
  constructor(msg, code, fn = WorkerError) {
    super(`${code}: ${msg}`)
    this.code = code

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, fn)
    }
  }

  get name() {
    return 'WorkerError'
  }

  static ALREADY_STARTED(msg) {
    return new WorkerError(msg, 'ALREADY_STARTED', WorkerError.ALREADY_STARTED)
  }
}
