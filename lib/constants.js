module.exports = {
  state: {
    ONLINE: 0x1,
    STARTED: 0x2,
    TERMINATING: 0x4,
    CLOSED: 0x8,
    DETACHED: 0x10,
    REFED: 0x20
  },
  message: {
    MESSAGE: 0,
    ONLINE: 1,
    BEFORE_EXIT: 2,
    ERROR: 3,
    TERMINATE: 4
  }
}
