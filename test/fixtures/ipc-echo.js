// Echo the first chunk received over the IPC stream back to the parent and
// end. Using `once` drops the only consumer afterwards so the worker can exit.
Bare.IPC.once('data', (data) => {
  Bare.IPC.end(data)
})
