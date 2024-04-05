module.exports = {
  state: {
    ONLINE: 0x1,
    STARTED: 0x2,
    TERMINATING: 0x4,
    EXITED: 0x8
  },
  message: {
    MESSAGE: 0,
    ONLINE: 1,
    EXIT: 2,
    ERROR: 3,
    TERMINATE: 4
  }
}
