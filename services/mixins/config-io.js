module.exports = {
  settings: {
    io: {
      cors: {
        origin: '*'
      },
      namespaces: {
        // ! FIXME Do we want MOAR namespaces???
        '/': {
          events: {
            call: {
              whitelist: ['gh-pubsub.*']
            },
            disconnect() {
              const socketId = this.id;

              this.$service.broker.emit('gh-pubsub.unregisterAll', { socketId });
            }
          }
        }
      }
    }
  }
};
