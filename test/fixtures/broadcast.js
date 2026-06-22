const { BroadcastChannel } = require('bare-worker')

const channel = new BroadcastChannel('test')

channel.postMessage('Hello broadcast')
