import { randomUUID } from 'node:crypto';
import type { SocketId } from 'socket.io-adapter';
import type { GHGatewayServiceSchema } from './types.js';

const TTL_SOCKET_UNREGISTERED = 15 * 1000;

export const TimeoutMap: Map<SocketId, NodeJS.Timeout> = new Map();

const Methods: Partial<GHGatewayServiceSchema> = {
  methods: {
    SocketAutoTimeoutMiddleware(socket, next) {
      // Set to autoTimeout
      TimeoutMap.set(socket.id, setTimeout(this.disconnectSocket.bind(this, socket), TTL_SOCKET_UNREGISTERED));

      return next();
    },

    disconnectSocket(socket) {
      this.logger.info(`Auto Disconnecting Socket Due to Inactivity: ${socket.id}`);

      this.broker.call('api.broadcast', {
        event: 'gh-pubsub.rejected',
        args: [
          {
            reason: 'Did not register for any PubSub services within the alloted time',
            pubSubMsgId: randomUUID({ disableEntropyCache: true })
          }
        ],
        rooms: [socket.id]
      });

      socket.disconnect(true);
    }
  }
};

export default Methods;
