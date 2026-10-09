const { parentPort } = require('bare-worker')

parentPort.postMessage(require('./preload-shared/shared').preloaded)
