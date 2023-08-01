import tmijs from 'tmi.js';

import type { PubSubEvent } from 'golden-hammer-shared';
import type { Redis } from 'ioredis';
import type { Cachers, Context, ServiceSchema } from 'moleculer';
import { hasListener, toggleEventTypesByClassifications } from './RegisterCache.js';
import Actions from './actions.js';
import Events from './events.js';
import TMIjsEventClassificationMap from './normalize/EventNormalizeMap.js';
import NormalizerFacade from './normalize/index.js';

type TwitchChatSimulate = {
  connectTarget: string;
  platformEventName: string;
  platformEventData: string;
};

const Service: ServiceSchema = {
  name: 'twitch-chat',
  mixins: [Actions, Events],

  created() {
    this.logger.info(`Identifying with: '${process.env.TMIJS_USERNAME}' / '${process.env.TMIJS_PASSWORD}'`);

    const client = new tmijs.Client({
      options: { skipUpdatingEmotesets: true, messagesLogLevel: 'info' },
      connection: {
        reconnect: true,
        secure: true
      },
      identity: {
        username: process.env.TMIJS_USERNAME,
        password: process.env.TMIJS_PASSWORD
      }
    });

    this.tmijs = client;

    this.normalizer = new NormalizerFacade();
  },

  async started() {
    this.tmijs.connect().catch(console.error);

    Object.keys(TMIjsEventClassificationMap).forEach(eventName => {
      this.tmijs.on(eventName, this.eventIRCEvent.bind(this, eventName));
    });

    // Notify log that we're connected
    this.tmijs.on('connected', () => {
      this.logger.info('Connected to Twitch IRC!');
    });

    // Notify log that we're connected
    this.tmijs.on('disconnected', () => {
      this.logger.info('Lost connection to Twitch IRC!');
    });

    this.logger.info('Started TMIjs Service!');
  },

  async stopped() {
    this.tmijs.disconnect();
    this.tmijs.removeAllListeners();
    this.tmijs = null;

    this.logger.info('Stopped TMIjs Service!');
  },

  actions: {
    joinChannel: {
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
      async handler(ctx) {
        const cacher = ctx.broker.cacher as Cachers.Redis<Redis>;
        return await toggleEventTypesByClassifications(cacher, ctx.params);
      }
    },

    unregister: {
      async handler(ctx) {
        const cacher = ctx.broker.cacher as Cachers.Redis<Redis>;
        return await toggleEventTypesByClassifications(cacher, ctx.params, false);
      }
    }
  },

  events: {
    'twitch-chat.simulate': {
      async handler(ctx: Context<TwitchChatSimulate>) {
        const { connectTarget, platformEventName, platformEventData } = ctx.params;

        this.eventIRCEvent.call(this, platformEventName, `#${connectTarget}`, ...platformEventData);
      }
    }
  },

  methods: {
    async eventIRCEvent(nativeEventName, ...incomingEventArguments) {
      const [channel] = incomingEventArguments;
      const cacher = this.broker.cacher as Cachers.Redis<Redis>;
      const connectTarget = channel.replace('#', '');

      const _hasListener = await hasListener(cacher, { connectTarget, nativeEventName });

      if (!_hasListener) {
        return this.logger.debug(`No Listeners for this event: (${nativeEventName}) ${connectTarget}`);
      }

      this.logger.debug(`Incoming Data: (${nativeEventName}) ${channel} ->`, incomingEventArguments);

      const normalizedContext = this.normalizer.normalize({ nativeEventName, incomingEventArguments });

      const { timestamp, eventClassification, normalizedData } = normalizedContext;

      const normalizedEvent: PubSubEvent = {
        timestamp,
        pubSubMsgId: 'INVALID_MSG_ID',
        eventClassification,
        connectTarget,
        normalizedData,
        platformEvent: {
          platformName: 'twitch',
          eventName: nativeEventName,
          eventData: incomingEventArguments
        }
      };

      // Emit the normalized data as a generic `gh-messaging.evented` message!
      this.broker.emit('gh-messaging.evented', normalizedEvent);
    }
  }
};

export default Service;
