/* global Bare */
const Channel = require('bare-channel')
const Module = require('bare-module')
const os = require('bare-os')
const { pathToFileURL } = require('url-file-url')
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

Bare.on('exit', async (exitCode) => {
  await port.write({ type: constants.message.EXIT, exitCode })
})

worker.parentPort = new MessagePort(port)

Module.load(Module.resolve(filename, pathToFileURL(os.cwd() + '/')))
