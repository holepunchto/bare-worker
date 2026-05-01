const { parentPort, getEnvironmentData } = require('bare-worker')

const data = {
  foo: getEnvironmentData('foo'),
  hello: getEnvironmentData('hello'),
  unknown: getEnvironmentData('unknown')
}

parentPort.postMessage(data)
