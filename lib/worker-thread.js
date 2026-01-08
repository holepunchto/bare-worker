const Channel = require('bare-channel')
const Module = require('bare-module')
const Bundle = require('bare-bundle')

const { source, channel: handle, workerData, preloads } = Bare.Thread.self.data

const bundle = Bundle.from(source)

const protocol = module.protocol.extend({
  postresolve(context, url) {
    return bundle.exists(url.href) ? url : context.postresolve(url)
  },

  exists(context, url, type) {
    return bundle.exists(url.href) || context.exists(url, type)
  },

  read(context, url) {
    return bundle.read(url.href) || context.read(url)
  }
})

const { main, imports, resolutions } = bundle

const cache = Object.create(null)

let Worker

try {
  const resolved = Module.resolve('bare-worker', new URL(main), { protocol, imports, resolutions })

  Worker = Module.load(resolved, { protocol, cache }).exports
} catch {
  Worker = require('..')
}

const channel = Channel.from(handle, { interfaces: [Worker.MessagePort] })

Worker.parentPort = new Worker.MessagePort(channel)
Worker.parentPort._online()

Worker.workerData = Bare.Thread.self.data = workerData

Bare.on('newListener', onnewlistener)
  .on('removeListener', onremovelistener)
  .on('uncaughtException', onerror)
  .on('unhandledRejection', onerror)

for (const [entry, source] of preloads) Module.load(new URL(entry), source, { cache })

Module.load(new URL('bare:/worker.bundle'), bundle, { cache })

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
  await Worker.parentPort._error(error)

  Bare.exitCode = 1
}
