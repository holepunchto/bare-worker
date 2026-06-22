# bare-worker

Higher-level worker threads for JavaScript. Built on top of <https://github.com/holepunchto/bare-thread> and <https://github.com/holepunchto/bare-channel>, it provides a `Worker` class together with `MessageChannel` and `MessagePort` primitives for passing structured messages between threads.

```
npm i bare-worker
```

## Usage

```js
const Worker = require('bare-worker')

if (Worker.isMainThread) {
  const worker = new Worker(__filename)

  worker.on('message', console.log).on('exit', (code) => {
    console.log('Worker exited with code', code)
  })
} else {
  Worker.parentPort.postMessage('Hello worker')
}
```

## API

#### `const worker = new Worker(entry[, options])`

Spawn a new worker thread that loads and runs the module at `entry`. `Worker` extends `MessagePort`, so the returned instance can be used to exchange messages with the worker.

Options include:

```js
options = {
  workerData: null
}
```

`workerData` is an arbitrary value cloned into the worker and made available there as `Worker.workerData`.

#### `worker.detached`

Whether the underlying message port has been detached for transfer. See `MessagePort`.

#### `await worker.terminate()`

Stop the worker as soon as possible. Returns a `Promise` that resolves with the worker's exit code once it has fully closed. Safe to call multiple times; subsequent calls resolve with the same exit code.

#### `event: 'online'`

Emitted when the worker thread has started executing.

#### `event: 'message'`

Emitted for each message sent from the worker with `parentPort.postMessage()`. The message value is passed to the listener.

#### `event: 'error'`

Emitted when an uncaught exception or unhandled rejection occurs in the worker. The error is passed to the listener and the worker exits with code `1`.

#### `event: 'exit'`

Emitted when the worker has stopped. The exit code is passed to the listener.

#### `Worker.isMainThread`

`true` when the current thread is the main thread, `false` when running inside a worker.

#### `Worker.parentPort`

Within a worker, the `MessagePort` connected to the parent thread. `null` on the main thread.

#### `Worker.workerData`

Within a worker, the `workerData` value passed when the worker was spawned. `null` on the main thread.

#### `Worker.MessageChannel`

The `MessageChannel` class. See below.

#### `Worker.MessagePort`

The `MessagePort` class. See below.

#### `Worker.BroadcastChannel`

The `BroadcastChannel` class. See below.

#### `Worker.preload(entry)`

Register the module at `entry` to be loaded in every worker before its own entry module runs. Preloads are inherited by nested workers.

#### `Worker.setEnvironmentData(key[, value])`

Set a value on the environment data shared with workers. The data is cloned into each worker as it is spawned. Omitting `value` removes `key`.

#### `Worker.getEnvironmentData(key)`

Get a value previously set with `Worker.setEnvironmentData()`.

### `MessageChannel`

#### `const channel = new MessageChannel()`

Create a pair of connected message ports for two-way communication. A port may be transferred to a worker by including it in the transfer list of a `postMessage()` call.

#### `channel.port1`

One end of the channel, a `MessagePort`.

#### `channel.port2`

The other end of the channel, a `MessagePort`.

### `MessagePort`

The endpoint of a message channel. `MessagePort` extends `EventEmitter`. A port begins receiving messages once it is started, which happens automatically when a `'message'` listener is added.

#### `port.detached`

Whether the port has been detached for transfer to another thread.

#### `port.postMessage(message[, transferList])`

Send `message` to the other end of the channel. `transferList` is an optional array of transferable objects, such as other `MessagePort` instances, whose ownership is moved to the receiving thread rather than cloned.

#### `port.start()`

Begin receiving messages on the port. Called automatically when a `'message'` listener is added, but may be called explicitly to start before any listener is attached.

#### `port.close()`

Close the port. No further messages will be sent or received.

#### `port.ref()`

Keep the underlying I/O resource referenced so it prevents the thread from exiting while the port is open.

#### `port.unref()`

Allow the thread to exit even while the port is open. Inflight writes are still awaited.

#### `port.hasRef()`

Whether the port is currently referenced.

#### `event: 'message'`

Emitted for each message received on the port. The message value is passed to the listener.

#### `event: 'close'`

Emitted when the port has closed.

### `BroadcastChannel`

A named channel for broadcasting messages to every other `BroadcastChannel` with the same name across the entire worker tree, including the main thread and nested workers. `BroadcastChannel` extends `EventEmitter` and follows the semantics of the Web `BroadcastChannel`: a channel never receives its own messages, but every other channel sharing its name does.

```js
const Worker = require('bare-worker')

const channel = new Worker.BroadcastChannel('updates')

channel.on('message', console.log)

channel.postMessage('Hello everyone')
```

#### `const channel = new BroadcastChannel(name)`

Create a channel bound to `name`. All channels constructed with the same `name`, in any thread of the worker tree, are connected.

#### `channel.name`

The name the channel is bound to.

#### `channel.postMessage(message)`

Broadcast `message` to every other connected channel sharing this channel's name. The message is cloned; unlike `MessagePort.postMessage()`, transferring is not supported. Throws if the channel has been closed.

#### `channel.close()`

Close the channel, disconnecting it from the others. No further messages will be sent or received.

#### `event: 'message'`

Emitted for each message broadcast to the channel by another channel sharing its name. The message value is passed to the listener.

## License

Apache-2.0
