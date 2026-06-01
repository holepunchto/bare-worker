# bare-worker

Higher-level worker threads for JavaScript.

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

## Notes

### `import()` Support

Since version `4.1.1`, the dynamic import syntax is no longer supported.

## License

Apache-2.0
