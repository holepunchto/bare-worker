const { parentPort } = require('bare-worker')

const importFn = new Function('path', 'return import(path)')

async function main() {
  const { default: data } = await importFn('./dynamic-import-return.js')

  parentPort.postMessage(data)
}

main()
