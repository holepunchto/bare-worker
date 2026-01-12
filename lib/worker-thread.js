const Module = require('bare-module')
const WorkerState = require('./worker-state')

const state = new WorkerState()

Bare.on('newListener', onnewlistener)
  .on('removeListener', onremovelistener)
  .on('uncaughtException', onerror)
  .on('unhandledRejection', onerror)

const cache = Object.create(null)

for (const [entry, source] of state.preloads) Module.load(new URL(entry), source, { cache })

Module.load(new URL('bare:/worker.bundle'), state.source, { cache })

function onnewlistener(name, fn) {
  if (fn === onremovelistener || fn === onerror) return

  switch (name) {
    case 'uncaughtException':
    case 'unhandledRejection':
      Bare.off(name, onerror)
  }
}

function onremovelistener(name, fn) {
  if (fn === onremovelistener || fn === onerror) return

  switch (name) {
    case 'uncaughtException':
    case 'unhandledRejection':
      if (Bare.listenerCount(name) === 0) Bare.on(name, onerror)
  }
}

async function onerror(error) {
  await state.port._error(error)

  Bare.exitCode = 1
}
