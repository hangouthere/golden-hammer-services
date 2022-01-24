module.exports = {
  io: {
    namespaces: {
      '/': {
        events: {
          call: {},
          listenToChannel() {
            debugger;
          }
        }
      }
    }
  }
};
