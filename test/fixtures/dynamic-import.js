const { parentPort } = require('bare-worker')

async function main() {
  const { default: data } = await import('./dynamic-import-return.js')
  parentPort.postMessage(data)
}

main()
