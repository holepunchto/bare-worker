const test = require('brittle')
const Worker = require('.')

test('basic', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/hello'))

  worker
    .on('message', (message) => {
      t.is(message, 'Hello worker')
    })
    .on('exit', (exitCode) => {
      t.is(exitCode, 0)
    })
})
