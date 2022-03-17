const { v4: uuidv4 } = require('uuid');
const { Cachers, Context, ServiceBroker } = require('moleculer');
const SERVICE_META = require('./service.meta');
const {
  KEY_REGISTERED,
  getRegistrationsForTargetByKey,
  getSocketsAwaitingEventForConnectTarget,
  checkIfSocketRegisteredForTarget,
  uncacheTargetForSocket,
  cacheTargetForSocket
} = require('./RegisterCache');

module.exports = {
  name: 'gh-pubsub',

  mixins: [require('../mixin-nodeRestartOnDisconnect'), SERVICE_META.MIXIN],

  actions: {
    register: {
      /**
       * @this ServiceBroker
       * @param {Context<import('golden-hammer-shared').PubSubMessagingInfo>} ctx
       */
      async handler(ctx) {
        const socketId = ctx.meta.$socketId;

        const connectTarget = ctx.params.connectTarget.toLowerCase(),
          { platformName, eventCategories } = ctx.params;

        /**@type {Cachers.Redis<import('ioredis').Redis>} */
        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);
        const keyTarget = `${platformName}-${connectTarget}`;
        const numConnected = await cacheTargetForSocket(cacher, {
          target: keyTarget,
          socketId,
          eventClassifications: eventCategories
        });

        // No sockets for the connectTarget yet, let's try to connect before we do anything else!
        if (1 === numConnected) {
          try {
            await this.connectToTarget(platformName, connectTarget);

            this.logger.info(
              `No previous Clients, Established connection to ConnectTarget: ${platformName}->${connectTarget}`
            );
          } catch (err) {
            this.logger.error(
              `No previous Clients, Unable to connect to ConnectTarget: ${platformName}->${connectTarget}`
            );

            // Return sub failure!
            return {
              registered: false,
              error: err.message,
              type: 'messaging',
              pubsub: {
                platformName,
                connectTarget
              }
            };
          }
        }

        this.logger.info(
          `PubSub Client (${socketId}) - Registered ${platformName}->${connectTarget}: ${eventCategories.join(', ')}`
        );

        // Announce that the socket is being used, to avoid expiry
        await ctx.broker.emit('api.socket-used', { socketId });

        // Return sub success!
        return {
          registered: true,
          type: 'messaging',
          pubsub: {
            platformName,
            connectTarget,
            eventCategories
          }
        };
      }
    },

    unregister: {
      /**
       * @this ServiceBroker
       * @param {Context<import('golden-hammer-shared').PubSubMessagingInfo>} ctx
       */
      async handler(ctx) {
        let { platformName, connectTarget } = ctx.params;
        const socketId = ctx.meta.$socketId;

        connectTarget = connectTarget.toLowerCase();

        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);
        const keyTarget = `${platformName}-${connectTarget}`;

        const unregisterError = await checkIfSocketRegisteredForTarget(cacher, {
          platformName,
          connectTarget,
          socketId
        });

        if (unregisterError) {
          this.logger.warn(unregisterError.error);
          return unregisterError;
        }

        const numConnected = await uncacheTargetForSocket(cacher, { target: keyTarget, socketId });

        this.logger.info(`PubSub Client (${socketId}) - Unregistered ${platformName}->${connectTarget}`);

        if (0 == numConnected) {
          await this.disconnectFromTarget(platformName, connectTarget);

          this.logger.info(
            `No more Clients, unestablished connection to ConnectTarget: ${platformName}->${connectTarget}`
          );
        }

        return {
          unregistered: true,
          type: 'messaging',
          pubsub: {
            platformName,
            connectTarget
          }
        };
      }
    },

    unregisterAll: {
      /**
       * @this ServiceBroker
       * @param {Context<{socketId:string}>} ctx
       */
      async handler(ctx) {
        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);
        const socketId = ctx.params.socketId;

        try {
          const targetsForSocket = await getRegistrationsForTargetByKey(cacher, {
            platformName: '',
            connectTarget: '',
            searchKey: `${cacher.prefix}${KEY_REGISTERED}:*-${socketId}`
          });

          let sData, platformName, connectTarget;
          for (let x = 0; x < targetsForSocket.length; x++) {
            sData = targetsForSocket[x];
            [platformName, connectTarget] = sData.target.split('-');

            // prettier-ignore
            await ctx.call(
              'gh-pubsub.unregister',
              { platformName, connectTarget },
              { meta: { $socketId: socketId } }
            );
          }

          this.logger.info(`Unregistered ALL PubSubs for Socket ID: ${socketId}`);
        } catch (err) {
          this.logger.error(`Could not Unregister ALL PubSubs for Socket ID: ${socketId}`);
        }
      }
    },

    simulate: {
      /**
       * @this ServiceBroker
       * @param {Context<import('golden-hammer-shared').PubSubMessagingInfo & {platformEventName:string, platformEventData:string}>} ctx
       */
      async handler(ctx) {
        const { platformName, connectTarget, platformEventName, platformEventData } = ctx.params;

        const delegateService = {
          twitch: 'twitch-chat'
        }[platformName];

        if (!delegateService) {
          throw new Error('Invalid Platform: ${platformName}');
        }

        this.broker.emit(`${delegateService}.simulate`, { connectTarget, platformEventName, platformEventData });
      }
    }
  },

  events: {
    // Unregister evented, usually from api socket.io gateway on detecting a disconnect
    // (see config-io.js)
    /** @this ServiceBroker */
    async 'gh-pubsub.unregisterAll'(ctx) {
      await this.actions.unregisterAll(ctx.params);
    },

    /**
     * On gh-messaging.evented, proxy to `api.broadcast` for known socketIds
     */
    'gh-messaging.evented': {
      ...SERVICE_META.EVENTS['gh-messaging.evented'],

      /**
       * @this ServiceBroker
       * @param {Context<import('golden-hammer-shared').NormalizedMessagingEvent>} ctx
       */
      async handler(ctx) {
        const {
          connectTarget,
          eventClassification,
          platform: { name: platformName }
        } = ctx.params;

        const socketIdsAwaitingThisEvent = await getSocketsAwaitingEventForConnectTarget(this.broker.cacher, {
          eventClassification,
          platformName,
          connectTarget
        });

        if (0 === socketIdsAwaitingThisEvent.length) {
          this.logger.info(
            `No Clients listening for ${platformName}(${connectTarget})->${eventClassification.category}.${eventClassification.subCategory}`
          );

          return;
        }

        this.logger.info(
          `Broadcasting to rooms (${platformName}(${connectTarget})->${eventClassification.category}.${eventClassification.subCategory}):`,
          socketIdsAwaitingThisEvent
        );

        ctx.broker.call('api.broadcast', {
          event: 'gh-messaging.evented',
          args: [{ ...ctx.params, pubSubMsgId: uuidv4() }],
          rooms: socketIdsAwaitingThisEvent
        });
      }
    }
  },

  methods: {
    async connectToTarget(platformName, connectTarget) {
      switch (platformName) {
        case 'twitch':
          await this.broker.call('twitch-chat.joinChannel', { connectTarget });
          break;
      }
    },

    async disconnectFromTarget(platformName, connectTarget) {
      switch (platformName) {
        case 'twitch':
          await this.broker.call('twitch-chat.partChannel', { connectTarget });
          break;
      }
    }
  }
};
