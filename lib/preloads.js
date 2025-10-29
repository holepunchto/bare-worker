const Thread = require('bare-thread')

const preloads = new Map()

if (
  Thread.self &&
  typeof Thread.self.data === 'object' &&
  Thread.self.data !== null &&
  typeof Thread.self.data.preloads === 'object' &&
  Thread.self.data.preloads !== null
) {
  for (const [entry, source] of Thread.self.data.preloads) {
    preloads.set(entry, source)
  }
}

module.exports = preloads
