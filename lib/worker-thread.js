const Thread = require('bare-thread')
const Channel = require('bare-channel')
const Module = require('bare-module')
const MessagePort = require('./message-port')
const worker = require('..')

const { source, channel: handle, workerData, preloads } = Thread.self.data

const channel = Channel.from(handle, { interfaces: [MessagePort] })

Bare.on('newListener', onnewlistener)
  .on('removeListener', onremovelistener)
  .on('uncaughtException', onerror)
  .on('unhandledRejection', onerror)

worker.parentPort = new MessagePort(channel)
worker.parentPort._online()

worker.workerData = workerData

const cache = Object.create(null)

for (const [entry, source] of preloads) Module.load(new URL(entry), source, { cache })

Module.load(new URL('bare:/worker.bundle'), source, { cache })

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
  await worker.parentPort._error(error)

  Bare.exitCode = 1
}
