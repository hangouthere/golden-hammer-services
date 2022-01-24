module.exports = {
  io: {
    cors: {
      origin: '*'
    },
    namespaces: {
      '/': {
        events: {
          call: {
            mappingPolicy: 'restrict'
          },
          listenToChannel(incomingValue, next) {
            console.log('Incoming Value:', incomingValue);

            return next({
              gotIt: true,
              error: false
            });
          }
        }
      }
    }
  }
};
