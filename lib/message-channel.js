const Channel = require('bare-channel')
const WorkerState = require('./worker-state')
const MessagePort = require('./message-port')

module.exports = class MessageChannel {
  constructor() {
    const channel = new Channel({ interfaces: [MessagePort] })

    this.port1 = new MessagePort(channel)
    this.port2 = new MessagePort(channel)
  }
}

if (WorkerState.parent) module.exports = WorkerState.parent.MessageChannel
