import Moleculer from 'moleculer';
import { v4 as uuidv4 } from 'uuid';

const TTL_SOCKET_UNREGISTERED = 15 * 1000;
const TimeoutMap = {};

export default {
  settings: {
    io: {
      cors: {
        origin: '*'
      },
      namespaces: {
        '/': {
          middlewares: [
            function () {
              this.SocketAutoTimeoutMiddleware(...arguments);
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
                  checkWhitelist(actionObj.name, this.$service.settings.io.namespaces['/'].events.call.whitelist)
                )
                .map(actionObj => ({ name: actionObj.name, params: actionObj.action.params }));

              callback(null, list);
            }
          }
        }
      }
    }
  },

  events: {
    // Socket is considered used, remove from autoTimeout feature
    'api.socket-used': {
      params: {
        socketId: 'string'
      },
      handler: async ctx => {
        const { socketId } = ctx.params;
        const timeoutId = TimeoutMap[socketId];

        clearTimeout(timeoutId);
        delete TimeoutMap[socketId];
      }
    }
  },

  methods: {
    SocketAutoTimeoutMiddleware(socket, next) {
      // Set to autoTimeout
      TimeoutMap[socket.id] = setTimeout(this.disconnectSocket.bind(this, socket), TTL_SOCKET_UNREGISTERED);

      return next();
    },

    disconnectSocket(socket) {
      this.logger.info(`Auto Disconnecting Socket Due to Inactivity: ${socket.id}`);

      this.broker.call('api.broadcast', {
        event: 'gh-pubsub.rejected',
        args: [{ reason: 'Did not register for any PubSub services within the alloted time', pubSubMsgId: uuidv4() }],
        rooms: [socket.id]
      });

      socket.disconnect(true);
    }
  }
};

function checkWhitelist(action, whitelist) {
  return whitelist.some(mask => Moleculer.match(action, mask));
}
