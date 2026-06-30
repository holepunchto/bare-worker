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

test('relative path', (t) => {
  t.plan(1)

  const worker = new Worker('./test/fixtures/hello.js')

  t.comment(worker)

  worker.on('exit', (exitCode) => t.is(exitCode, 0))
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

test('transfer message port from worker', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/transfer-message-port-from-worker'))

  worker
    .on('message', (port) => {
      port.once('message', (message) => t.is(message, 'Hello worker')).postMessage('Hello worker')
    })
    .on('exit', (exitCode) => t.is(exitCode, 0))
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

test('argv', (t) => {
  t.plan(4)

  const entry = require.resolve('./test/fixtures/argv')

  const worker = new Worker(entry, { argv: ['foo', 42, true] })

  worker
    .on('message', (argv) => {
      t.is(argv[0], Bare.argv[0], 'keeps the executable path')
      t.is(argv[1], entry, 'places the worker entry second')
      t.alike(argv.slice(2), ['foo', '42', 'true'], 'appends stringified args')
    })
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

test('broadcast channel from worker to main', (t) => {
  t.plan(2)

  // Connect the receiving end before spawning the worker so it is already a
  // peer by the time the worker broadcasts.
  const channel = new Worker.BroadcastChannel('test')

  channel.on('message', (message) => {
    t.is(message, 'Hello broadcast')
    channel.close()
  })

  const worker = new Worker(require.resolve('./test/fixtures/broadcast'))

  worker.on('exit', (exitCode) => t.is(exitCode, 0))
})

test('broadcast channel from main to worker', (t) => {
  t.plan(2)

  const channel = new Worker.BroadcastChannel('test')

  const worker = new Worker(require.resolve('./test/fixtures/broadcast-relay'))

  worker
    .on('message', (message) => {
      // The worker echoes back over its parent port once it receives the
      // broadcast, confirming delivery from the main thread.
      if (message === 'ready') {
        channel.postMessage('Hello worker')
      } else {
        t.is(message, 'Hello worker')
        channel.close()
      }
    })
    .on('exit', (exitCode) => t.is(exitCode, 0))
})

test('broadcast channel from worker to worker', (t) => {
  t.plan(2)

  const receiver = new Worker(require.resolve('./test/fixtures/broadcast-relay'))

  receiver.on('message', (message) => {
    // Only spawn the sender once the receiver is connected, so it does not miss
    // the broadcast.
    if (message === 'ready') {
      const sender = new Worker(require.resolve('./test/fixtures/broadcast'))

      sender.on('exit', (exitCode) => t.is(exitCode, 0))
    } else {
      t.is(message, 'Hello broadcast')
    }
  })
})

test('broadcast channel keeps receiving after all peers leave and rejoin', (t) => {
  t.plan(3)

  // Connect the receiver first so it is already a peer when the workers
  // broadcast.
  const channel = new Worker.BroadcastChannel('test')

  let received = 0

  channel.on('message', (message) => {
    t.is(message, 'Hello broadcast')

    if (++received === 2) channel.close()
  })

  // The first worker broadcasts and exits, dropping the peer count to zero and
  // ending the receiver's read loop. The second worker, spawned afterwards,
  // must still reach the receiver once the read loop restarts on rejoin.
  const first = new Worker(require.resolve('./test/fixtures/broadcast'))

  first.on('exit', (exitCode) => {
    t.is(exitCode, 0)

    new Worker(require.resolve('./test/fixtures/broadcast'))
  })
})

test('broadcast channel reaches nested workers', (t) => {
  t.plan(1)

  const channel = new Worker.BroadcastChannel('test')

  channel.on('message', (message) => {
    t.is(message, 'Hello broadcast')
    channel.close()
  })

  new Worker(require.resolve('./test/fixtures/broadcast-nested'))
})

test('broadcast channel does not receive its own messages', (t) => {
  t.plan(1)

  const a = new Worker.BroadcastChannel('room-self')
  const b = new Worker.BroadcastChannel('room-self')

  a.on('message', () => t.fail('a received its own message'))

  b.on('message', (message) => {
    t.is(message, 'ping')
    a.close()
    b.close()
  })

  a.postMessage('ping')
})

test('broadcast channel ignores messages for other names', (t) => {
  t.plan(1)

  const a = new Worker.BroadcastChannel('room-names')
  const b = new Worker.BroadcastChannel('room-names')
  const other = new Worker.BroadcastChannel('other-name')

  other.on('message', () => t.fail('channel received a message for another name'))

  b.on('message', (message) => {
    t.is(message, 'ping')
    a.close()
    b.close()
    other.close()
  })

  a.postMessage('ping')
})

test('broadcast channel delivers multiple messages in order', (t) => {
  t.plan(1)

  const a = new Worker.BroadcastChannel('room-order')
  const b = new Worker.BroadcastChannel('room-order')

  const received = []

  b.on('message', (message) => {
    received.push(message)

    if (received.length === 3) {
      t.alike(received, [1, 2, 3])
      a.close()
      b.close()
    }
  })

  a.postMessage(1)
  a.postMessage(2)
  a.postMessage(3)
})

test('broadcast channel stops receiving after close', (t) => {
  t.plan(1)

  const a = new Worker.BroadcastChannel('room-closed')
  const b = new Worker.BroadcastChannel('room-closed')
  const c = new Worker.BroadcastChannel('room-closed')

  b.close()
  b.on('message', () => t.fail('closed channel received a message'))

  c.on('message', (message) => {
    t.is(message, 'ping')
    a.close()
    c.close()
  })

  a.postMessage('ping')
})

test('broadcast channel coerces its name to a string', (t) => {
  t.plan(1)

  const channel = new Worker.BroadcastChannel(42)

  t.is(channel.name, '42')

  channel.close()
})

test('broadcast channel throws when posting after close', (t) => {
  t.plan(1)

  const channel = new Worker.BroadcastChannel('closed-throw')

  channel.close()

  t.exception(() => channel.postMessage('nope'))
})

test('broadcast channel can be closed more than once', (t) => {
  t.plan(1)

  const channel = new Worker.BroadcastChannel('closed-twice')

  channel.close()
  channel.close()

  t.pass()
})

test('ipc from worker', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/ipc'))

  worker.IPC.on('data', (data) => t.is(data.toString(), 'Hello worker'))

  worker.on('exit', (exitCode) => t.is(exitCode, 0))
})

test('ipc echo', (t) => {
  t.plan(2)

  const worker = new Worker(require.resolve('./test/fixtures/ipc-echo'))

  worker.IPC.on('data', (data) => {
    t.is(data.toString(), 'Hello worker')
    worker.IPC.end()
  })

  worker.on('exit', (exitCode) => t.is(exitCode, 0))

  worker.IPC.write('Hello worker')
})

test('dynamic import()', (t) => {
  t.plan(3)

  const worker = new Worker(require.resolve('./test/fixtures/dynamic-imports'))

  t.comment(worker)

  worker
    .on('online', () => t.pass())
    .on('message', (message) => t.is(message, 'Hello worker'))
    .on('exit', (exitCode) => t.is(exitCode, 0))
})
