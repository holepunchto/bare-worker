const { BroadcastChannel } = require('bare-worker')

const broadcastChannel = new BroadcastChannel('hello')

broadcastChannel.postMessage('Hello from worker')
broadcastChannel.close()
