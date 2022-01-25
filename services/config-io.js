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
          async listenToChannel({ channelName }, next) {
            const span = this.$service.broker.tracer.startSpan('PubSub: Channel Listen - Register', {
              service: 'pub-sub:chat',
              tags: {
                channelName,
                socket: {
                  id: this.client.conn.id,
                  remoteAddress: this.client.conn.remoteAddress
                }
              }
            });

            await this.$service.broker.call('twitch-chat.joinChannel', { channelName });

            this.$service.logger.info('PubSub to Channel:', channelName);

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
