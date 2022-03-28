const tmijs = require('tmi.js');
const { Context, Service, Cachers } = require('moleculer');
const TMIjsEventClassificationMap = require('./normalize/EventNormalizeMap');
const Normalizer = require('./normalize');
const SERVICE_META = require('./service.meta');
const { toggleEventTypesByClassifications } = require('./RegisterCache');
const { hasListener } = require('./RegisterCache');

module.exports = {
  name: 'twitch-chat',

  mixins: [require('../mixin-nodeRestartOnDisconnect'), SERVICE_META.MIXIN],

  created() {
    const client = new tmijs.Client({
      // @ts-ignore
      options: { skipUpdatingEmotesets: true, messagesLogLevel: 'info', logLevel: 'info' },
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

    this.normalizer = new Normalizer();
  },

  async started() {
    this.tmijs.connect().catch(console.error);

    Object.keys(TMIjsEventClassificationMap).forEach(eventName => {
      this.tmijs.on(eventName, this.delegateIRCEvent.bind(this, eventName));
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
      /** @param {Context<{connectTarget:string}, {eventClassifications:string[]}>} ctx */
      async handler(ctx) {
        const { connectTarget } = ctx.params;

        try {
          await this.tmijs.join(connectTarget);

          this.logger.info(`Joined Channel: ${connectTarget}`);
        } catch (err) {
          this.logger.error(err);
          throw err;
        }

        return true;
      }
    },

    partChannel: {
      /** @param {Context<{connectTarget:string}>} ctx */
      async handler(ctx) {
        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);
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
      /** @param {Context<{connectTarget: string, eventClassifications: string[]}>} ctx */
      async handler(ctx) {
        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);
        return await toggleEventTypesByClassifications(cacher, ctx.params);
      }
    },

    unregister: {
      /** @param {Context<{connectTarget: string, eventClassifications: string[]}>} ctx */
      async handler(ctx) {
        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);
        return await toggleEventTypesByClassifications(cacher, ctx.params, false);
      }
    }
  },

  events: {
    'twitch-chat.simulate': {
      ...SERVICE_META.EVENTS['gh-messaging.twitch-chat.simulate'],

      /**
       * @this Service
       * @param {Context<{connectTarget:string, platformEventName:string, platformEventData:string}>} ctx
       */
      async handler(ctx) {
        const { connectTarget, platformEventName, platformEventData } = ctx.params;

        this.delegateIRCEvent.call(this, platformEventName, `#${connectTarget}`, ...platformEventData);
      }
    }
  },

  methods: {
    /** @this Service */
    async delegateIRCEvent(nativeEventName, channel, ...incomingEventArguments) {
      const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (this.broker.cacher);
      const connectTarget = channel.replace('#', '');

      const _hasListener = await hasListener(cacher, { connectTarget, nativeEventName });

      if (!_hasListener) {
        return this.logger.debug(`No Listeners for this event: (${nativeEventName}) ${connectTarget}`);
      }

      this.logger.debug(`Incoming Data: (${nativeEventName}) ${channel} ->`, incomingEventArguments);

      const normalizedContext = this.normalizer.normalize(nativeEventName, incomingEventArguments);

      const { timestamp, eventClassification, normalizedData } = normalizedContext;

      /** @type {import('golden-hammer-shared').NormalizedMessagingEvent} */
      const normalizedEvent = {
        timestamp,
        pubSubMsgId: 'INVALID_MSG_ID',
        eventClassification,
        connectTarget,
        eventData: normalizedData,
        platform: {
          name: 'twitch',
          eventName: nativeEventName,
          eventData: incomingEventArguments
        }
      };

      // Emit the normalized data as a generic `gh-messaging.evented` message!
      this.broker.emit('gh-messaging.evented', normalizedEvent);
    }
  }
};
