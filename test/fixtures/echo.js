const worker = require('bare-worker')

worker.parentPort.on('message', (data) => {
  worker.parentPort.postMessage(data)
})
