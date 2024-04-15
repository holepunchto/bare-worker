const { parentPort } = require('bare-worker')

parentPort.once('message', (port) => {
  port.once('message', (msg) => port.postMessage(msg))
})
