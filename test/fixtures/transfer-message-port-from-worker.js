const { parentPort, MessageChannel } = require('bare-worker')

const channel = new MessageChannel()

channel.port1.once('message', (message) => channel.port1.postMessage(message))

parentPort.postMessage(channel.port2, [channel.port2])
