const { parentPort } = require('bare-worker')

parentPort.postMessage('Hello worker')
