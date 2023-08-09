import type { Redis } from 'ioredis';
import type { Cachers } from 'moleculer';
import { toggleEventTypesByClassifications } from './RegisterCache.js';
import type { TwitchChatServiceSchema } from './types.js';

const Actions: Partial<TwitchChatServiceSchema> = {
  actions: {
    joinChannel: {
      params: {
        connectTarget: 'string'
      },
      async handler(ctx) {
        const { connectTarget } = ctx.params;

        try {
          await this.tmijs.join(connectTarget);

          this.logger.info(`Joined Channel: ${connectTarget}`);
        } catch (err) {
          this.logger.error(err);
          // throw err;
        }

        return true;
      }
    },

    partChannel: {
      params: {
        connectTarget: 'string'
      },
      async handler(ctx) {
        const { connectTarget } = ctx.params;

        try {
          await this.tmijs.part(connectTarget);

          this.logger.info(`Parted Channel: ${connectTarget}`);
        } catch (err) {
          this.logger.error(err);
          // throw err; //!FIXME THis was causing the service to stop working... not sure why.. figure this out?
        }

        return true;
      }
    },

    register: {
      params: {
        connectTarget: 'string',
        eventClassifications: 'string[]'
      },
      async handler(ctx) {
        const cacher = ctx.broker.cacher as Cachers.Redis<Redis>;
        return await toggleEventTypesByClassifications(cacher, ctx.params);
      }
    },

    unregister: {
      params: {
        connectTarget: 'string',
        eventClassifications: 'string[]'
      },
      async handler(ctx) {
        const cacher = ctx.broker.cacher as Cachers.Redis<Redis>;
        return await toggleEventTypesByClassifications(cacher, ctx.params, false);
      }
    }
  }
};

export default Actions;
