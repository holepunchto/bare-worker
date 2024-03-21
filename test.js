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

test('uncaught exception', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/throw'))

  worker
    .on('error', (err) => {
      t.is(err.message, 'error')
    })
    .on('exit', (exitCode) => {
      t.is(exitCode, 1)
    })
})

test('exception with uncaught handler', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/throw-with-uncaught-handler'))

  worker
    .on('message', (err) => {
      t.is(err.message, 'error')
    })
    .on('exit', (exitCode) => {
      t.is(exitCode, 0)
    })
})
