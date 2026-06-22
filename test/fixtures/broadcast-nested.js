const Worker = require('bare-worker')

// Spawn a nested worker that broadcasts, exercising handle propagation through
// more than one level of the worker tree.
const worker = new Worker(require.resolve('./broadcast'))

worker.on('exit', () => Bare.exit())
