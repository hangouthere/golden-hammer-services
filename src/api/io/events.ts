import type { Context } from 'moleculer';
import { TimeoutMap } from './methods.js';
import type { GHGatewayServiceSchema } from './types.js';

const Events: Partial<GHGatewayServiceSchema> = {
  events: {
    // Socket is considered used, remove from autoTimeout feature
    'api.socket-used': {
      params: {
        socketId: 'string'
      },
      //(SocketIO doesn't define this properly)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async (ctx: Context<any>) => {
        const { socketId } = ctx.params;
        const timeoutId = TimeoutMap.get(socketId);

        clearTimeout(timeoutId);
        TimeoutMap.delete(socketId);
      }
    }
  }
};

export default Events;
