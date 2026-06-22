const { parentPort, BroadcastChannel } = require('bare-worker')

const channel = new BroadcastChannel('test')

channel.on('message', (message) => {
  parentPort.postMessage(message)
  channel.close()
})

// Signal that the channel is connected so the other end can safely broadcast.
parentPort.postMessage('ready')
