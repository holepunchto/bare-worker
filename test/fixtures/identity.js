const Worker = require('bare-worker')

const channel = new Worker.MessageChannel()

Worker.parentPort.postMessage({
  parentPortIsMessagePort: Worker.parentPort instanceof Worker.MessagePort,
  channelPort1IsMessagePort: channel.port1 instanceof Worker.MessagePort,
  channelIsMessageChannel: channel instanceof Worker.MessageChannel
})
