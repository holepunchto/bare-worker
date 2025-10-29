module.exports = class WorkerError extends Error {
  constructor(msg, fn = WorkerError, code = fn.name) {
    super(`${code}: ${msg}`)

    this.code = code

    if (Error.captureStackTrace) Error.captureStackTrace(this, fn)
  }

  get name() {
    return 'WorkerError'
  }

  static ALREADY_STARTED(msg) {
    return new WorkerError(msg, WorkerError.ALREADY_STARTED)
  }
}
