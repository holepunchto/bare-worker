const { parentPort } = require('bare-worker')

Bare.on('uncaughtException', (err) => {
  parentPort.postMessage(err)
})

throw new Error('error')
