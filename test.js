const test = require('brittle')
const Worker = require('.')

test('basic', (t) => {
  t.plan(3)

  const worker = new Worker(require.resolve('./test/fixtures/hello'))

  t.comment(worker)

  worker
    .on('online', () => t.pass())
    .on('message', (message) => t.is(message, 'Hello worker'))
    .on('exit', (exitCode) => t.is(exitCode, 0))
})

test('message', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/echo'))

  worker
    .on('message', (message) => t.is(message, 'Hello worker'))
    .on('exit', (exitCode) => t.is(exitCode, 0))
    .postMessage('Hello worker')
})

test('terminate', async (t) => {
  t.plan(1)

  const worker = new Worker(require.resolve('./test/fixtures/timeout'))

  const exitCode = await worker.terminate()

  t.is(exitCode, 0)
})

test('uncaught exception', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/throw'))

  worker
    .on('error', (err) => t.is(err.message, 'error'))
    .on('exit', (exitCode) => t.is(exitCode, 1))
})

test('exception with uncaught handler', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/throw-with-uncaught-handler'))

  worker
    .on('message', (err) => t.is(err.message, 'error'))
    .on('exit', (exitCode) => t.is(exitCode, 0))
})

test('transfer message port', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/transfer-message-port'))

  const channel = new Worker.MessageChannel()

  channel.port1
    .on('message', (message) => t.is(message, 'Hello worker'))
    .postMessage('Hello worker')

  worker.on('exit', (exitCode) => t.is(exitCode, 0)).postMessage(channel.port2, [channel.port2])
})
