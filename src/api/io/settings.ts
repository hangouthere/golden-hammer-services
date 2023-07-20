import { Utils } from 'moleculer';
import type { GHGatewayServiceSchema, IOEventCallback } from './types.js';

const Settings: Partial<GHGatewayServiceSchema> = {
  settings: {
    io: {
      namespaces: {
        '/': {
          middlewares: [
            function (this: GHGatewayServiceSchema['methods'], ...args) {
              this.SocketAutoTimeoutMiddleware(...args);
            }
          ],
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
                  checkWhitelist(
                    actionObj.name as string,
                    this.$service.settings.io.namespaces['/'].events.call.whitelist as string[]
                  )
                )
                .map(actionObj => ({ name: actionObj.name, params: actionObj.action?.params }));

              (callback as IOEventCallback)(null, list);
            }
          }
        }
      }
    }
  }
};

function checkWhitelist(action: string, whitelist: string[]) {
  return whitelist.some(mask => Utils.match(action, mask));
}

export default Settings;
