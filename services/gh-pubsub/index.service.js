const { v4: uuidv4 } = require('uuid');
const { Cachers, Context, Service } = require('moleculer');
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
       * @this Service
       * @param {Context<import('golden-hammer-shared').PubSubMessagingInfo>} ctx
       */
      async handler(ctx) {
        const socketId = ctx.meta.$socketId;

        const connectTarget = ctx.params.connectTarget.toLowerCase(),
          { platformName, eventClassifications } = ctx.params;

        /**@type {Cachers.Redis<import('ioredis').Redis>} */
        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);
        const keyTarget = `${platformName}-${connectTarget}`;
        const numConnected = await cacheTargetForSocket(cacher, {
          target: keyTarget,
          socketId,
          eventClassifications
        });

        // No sockets for the connectTarget yet, let's try to connect before we do anything else!
        if (1 === numConnected) {
          try {
            // Delegate Connecting if there aren't any previous clients connected
            await this.connectToTarget(platformName, connectTarget);

            this.logger.info(
              `No previous Clients, Established connection to ConnectTarget: ${platformName}->${connectTarget}`
            );
          } catch (err) {
            this.logger.error(
              `No previous Clients, Unable to connect to ConnectTarget: ${platformName}->${connectTarget}`,
              err
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
          //prettier-ignore
          `PubSub Client (${socketId}) - Registered ${platformName}->${connectTarget}: ${eventClassifications.join(', ')}`
        );

        // Announce that the socket is being used, to avoid expiry
        await ctx.broker.emit('api.socket-used', { socketId });

        // Delegate the registration with the underlying service
        await this.registerWithPlatform(platformName, connectTarget, eventClassifications);

        // Return sub success!
        return {
          registered: true,
          type: 'messaging',
          pubsub: {
            platformName,
            connectTarget,
            eventClassifications
          }
        };
      }
    },

    unregister: {
      /**
       * @this Service
       * @param {Context<import('golden-hammer-shared').PubSubMessagingInfo>} ctx
       */
      async handler(ctx) {
        let { platformName, connectTarget } = ctx.params;
        const socketId = ctx.meta.$socketId;

        connectTarget = connectTarget.toLowerCase();

        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);
        const keyTarget = `${platformName}-${connectTarget}`;

        const unregisterError = await checkIfSocketRegisteredForTarget(cacher, {
          connectTarget,
          platformName,
          socketId
        });

        if (unregisterError) {
          this.logger.debug(unregisterError.error);
          return unregisterError;
        }

        const { numConnected, eventClassifications } = await uncacheTargetForSocket(cacher, {
          target: keyTarget,
          socketId
        });

        this.logger.info(`PubSub Client (${socketId}) - Unregistered ${platformName}->${connectTarget}`);

        // Delegate the unregistration with the underlying service
        await this.unregisterWithPlatform(platformName, connectTarget, eventClassifications);

        if (0 == numConnected) {
          // Delegate disconnecting if there aren't any more clients connected
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
       * @this Service
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
          this.logger.error(`Could not Unregister ALL PubSubs for Socket ID: ${socketId}`, err);
        }
      }
    },

    simulate: {
      /**
       * @this Service
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
    /** @this Service */
    async 'gh-pubsub.unregisterAll'(ctx) {
      await this.actions.unregisterAll(ctx.params);
    },

    /**
     * On gh-messaging.evented, proxy to `api.broadcast` for known socketIds
     */
    'gh-messaging.evented': {
      ...SERVICE_META.EVENTS['gh-messaging.evented'],

      /**
       * @this Service
       * @param {Context<import('golden-hammer-shared').NormalizedMessagingEvent>} ctx
       */
      async handler(ctx) {
        const {
          eventClassification,
          connectTarget,
          platform: { name: platformName }
        } = ctx.params;

        const cacher = /**@type {Cachers.Redis<import('ioredis').Redis>} */ (ctx.broker.cacher);

        const socketIdsAwaitingThisEvent = await getSocketsAwaitingEventForConnectTarget(cacher, {
          eventClassification,
          platformName,
          connectTarget
        });

        if (0 === socketIdsAwaitingThisEvent.length) {
          return this.logger.debug(
            `No Clients listening for ${platformName}(${connectTarget})->${eventClassification}`
          );
        }

        this.logger.debug(
          `Broadcasting to rooms (${platformName}(${connectTarget})->${eventClassification}):`,
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
    /** @this Service */
    async connectToTarget(platformName, connectTarget) {
      //!FIXME Change `joinChannel` to match pubsub name (ie, connectToTarget)
      const serviceCall = {
        twitch: 'twitch-chat.joinChannel'
      }[platformName];

      await this.broker.call(`${serviceCall}`, { connectTarget });
    },

    /** @this Service */
    async disconnectFromTarget(platformName, connectTarget) {
      const serviceCall = {
        twitch: 'twitch-chat.partChannel'
      }[platformName];

      await this.broker.call(`${serviceCall}`, { connectTarget });
    },

    /** @this Service */
    async registerWithPlatform(platformName, connectTarget, eventClassifications) {
      const serviceName = {
        twitch: 'twitch-chat'
      }[platformName];

      await this.broker.call(`${serviceName}.register`, { connectTarget, eventClassifications });
    },

    /** @this Service */
    async unregisterWithPlatform(platformName, connectTarget, eventClassifications) {
      const serviceName = {
        twitch: 'twitch-chat'
      }[platformName];

      await this.broker.call(`${serviceName}.unregister`, { connectTarget, eventClassifications });
    }
  }
};
