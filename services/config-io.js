module.exports = {
  io: {
    cors: {
      origin: '*'
    },
    namespaces: {
      '/': {
        events: {
          call: {
            whitelist: ['pubsub.*']
          }
        }
      }
    }
  }
};
