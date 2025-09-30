const { Thread } = Bare

const preloads = new Set()

if (
  Thread.self &&
  typeof Thread.self.data === 'object' &&
  Thread.self.data !== null &&
  typeof Thread.self.data.preloads === 'object' &&
  Thread.self.data.preloads !== null
) {
  for (const filename of Thread.self.data.preloads) preloads.add(filename)
}

module.exports = preloads
