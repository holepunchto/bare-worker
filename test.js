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

test('environment data', (t) => {
  t.plan(3)

  const { getEnvironmentData, setEnvironmentData } = Worker

  setEnvironmentData('foo', 'bar')
  setEnvironmentData('hello', { value: 'world' })

  t.is(getEnvironmentData('foo'), 'bar')

  const worker = new Worker(require.resolve('./test/fixtures/env-data'))

  setEnvironmentData('foo')

  const expectedData = { foo: 'bar', hello: { value: 'world' }, unknown: undefined }

  worker
    .on('message', (envData) => t.alike(envData, expectedData))
    .on('exit', (exitCode) => t.is(exitCode, 0))
})

test('message port ref, unref and hasRef', (t) => {
  t.plan(2)

  const port = new Worker.MessageChannel().port1

  port.ref()
  t.is(port.hasRef(), true)

  port.unref()
  t.is(port.hasRef(), false)
})
