const { parentPort } = require('bare-worker')

parentPort.postMessage(Bare.argv)
