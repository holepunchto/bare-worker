const WorkerState = require('./worker-state')

const preloads = new Map()

if (WorkerState.parent) {
  for (const [entry, source] of WorkerState.parent.preloads) {
    preloads.set(entry, source)
  }
}

module.exports = preloads
