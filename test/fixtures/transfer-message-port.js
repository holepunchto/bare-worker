const { parentPort } = require('bare-worker')

parentPort.on('message', (port) => {
  port.on('message', (msg) => port.postMessage(msg))
})
