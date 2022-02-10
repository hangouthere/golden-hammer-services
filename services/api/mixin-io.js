const { match } = require('moleculer').Utils;

module.exports = {
  settings: {
    io: {
      cors: {
        origin: '*'
      },
      namespaces: {
        '/': {
          events: {
            call: {
              whitelist: ['gh-pubsub.*']
            },
            disconnect() {
              const socketId = this.id;

              this.$service.logger.info(
                `PubSub Client (${socketId}) - Disconnected, Attempting to Unregister all PubSubs!`
              );

              this.$service.broker.emit('gh-pubsub.unregisterAll', { socketId });
            },
            listHandlers(_, callback) {
              const list = this.$service.broker.registry
                .getActionList({})
                .filter(actionObj =>
                  checkWhitelist(actionObj.name, this.$service.settings.io.namespaces['/'].events.call.whitelist)
                )
                .map(actionObj => ({ name: actionObj.name, params: actionObj.action.params }));

              callback(null, list);
            }
          }
        }
      }
    }
  }
};

function checkWhitelist(action, whitelist) {
  return whitelist.some(mask => match(action, mask));
}
