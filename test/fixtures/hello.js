const worker = require('bare-worker')

worker.parentPort.postMessage('Hello worker')
