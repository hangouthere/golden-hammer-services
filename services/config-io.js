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
            debugger;

            const span = this.$service.broker.tracer.startSpan('PubSub: Channel Listen - Register', {
              service: 'pub-sub:chat',
              tags: {
                socket: { id: this.client.conn.id, remoteAddress: this.client.conn.remoteAddress }
              }
            });

            console.log('Incoming Value:', incomingValue);

            span.finish();

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
