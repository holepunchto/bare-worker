/* global Bare */
const Channel = require('bare-channel')
const Module = require('bare-module')
const os = require('bare-os')
const url = require('bare-url')
const MessagePort = require('./message-port')
const worker = require('..')
const { Thread } = Bare

const { channel: handle, filename, data } = Thread.self.data

const channel = Channel.from(handle, { interfaces: [MessagePort] })

Bare.on('newListener', onnewlistener)
  .on('removeListener', onremovelistener)
  .on('uncaughtException', onerror)
  .on('unhandledRejection', onerror)

worker.parentPort = new MessagePort(channel)
worker.parentPort._online()

worker.workerData = data

Module.load(Module.resolve(filename, url.pathToFileURL(os.cwd() + '/')))

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
