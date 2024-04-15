const { parentPort } = require('bare-worker')

parentPort.once('message', (data) => {
  parentPort.postMessage(data)
})
