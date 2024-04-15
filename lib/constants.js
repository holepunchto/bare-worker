module.exports = {
  state: {
    ONLINE: 0x1,
    STARTED: 0x2,
    TERMINATING: 0x4,
    CLOSED: 0x8,
    EXITED: 0x10,
    DETACHED: 0x20,
    REFED: 0x40,
    UNREFED: 0x80
  },
  message: {
    MESSAGE: 0,
    ONLINE: 1,
    EXIT: 2,
    ERROR: 3,
    TERMINATE: 4
  }
}
