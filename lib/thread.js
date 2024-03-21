/* global Bare */
const Channel = require('bare-channel')
const Module = require('bare-module')
const os = require('bare-os')
const url = require('url-file-url')
const MessagePort = require('./message-port')
const constants = require('./constants')
const worker = require('..')
const { Thread } = Bare

const {
  channel: handle,
  filename
} = Thread.self.data

const channel = Channel.from(handle)

const port = channel.connect()

port.unref()

Bare
  .on('newListener', onnewlistener)
  .on('removeListener', onremovelistener)
  .on('uncaughtException', onerror)
  .on('unhandledRejection', onerror)
  .on('exit', onexit)

worker.parentPort = new MessagePort(port)

Module.load(Module.resolve(filename, url.pathToFileURL(os.cwd() + '/')))

function onnewlistener (name, fn) {
  if (fn === onremovelistener || fn === onerror || fn === onexit) return

  switch (name) {
    case 'uncaughtException':
    case 'unhandledRejection':
      Bare.off(name, onerror)
  }
}

function onremovelistener (name, fn) {
  if (fn === onremovelistener || fn === onerror || fn === onexit) return

  switch (name) {
    case 'uncaughtException':
    case 'unhandledRejection':
      if (Bare.listenerCount(name) === 0) Bare.on(name, onerror)
  }
}

async function onerror (error) {
  await port.write({ type: constants.message.ERROR, error })

  Bare.exit(1)
}

async function onexit (exitCode) {
  await port.write({ type: constants.message.EXIT, exitCode })
}
