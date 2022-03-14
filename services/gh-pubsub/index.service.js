const { EventClassifications } = require('golden-hammer-shared');

const { v4: uuidv4 } = require('uuid');
const { Context } = require('moleculer');
const {
  getConnectTargetInfoOnPlatformForSocketId,
  unregisterSocketFromConnectTargetAndPlatformName,
  registerSocketIdToPlatformNameAndConnectTarget,
  getSocketIdsForEventCategoryOnPlatformNameForConnectTarget,
  getConnectTargetMapForSocketId,
  getSocketIdsForConnectTargetOnPlatform
} = require('./pubsubCacher');

const VALIDATOR_PLATFORMS = { type: 'string', enum: ['twitch'] };

module.exports = {
  name: 'gh-pubsub',

  mixins: [require('../mixin-nodeRestartOnDisconnect')],

  actions: {
    register: {
      tags: {
        params: true,
        meta: true
      },
      params: {
        platformName: VALIDATOR_PLATFORMS,
        connectTarget: 'string',
        eventCategories: 'string[]'
      },
      /** @param {Context} ctx */
      async handler(ctx) {
        const socketId = ctx.meta.$socketId;

        let connectTarget = ctx.params.connectTarget.toLowerCase(),
          { platformName, eventCategories } = ctx.params;

        const { platformSocketIds, connectTargetSocketIds } = getSocketIdsForConnectTargetOnPlatform(
          platformName,
          connectTarget
        );

        const hasPrevSockets = connectTargetSocketIds.size > 0;

        // No sockets for the connectTarget yet, let's try to connect before we do anything else!
        if (!hasPrevSockets) {
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

        registerSocketIdToPlatformNameAndConnectTarget({
          socketId,
          platformName,
          connectTarget,
          eventCategories,
          connectTargetSocketIds,
          platformSocketIds
        });

        this.logger.info(
          `PubSub Client (${socketId}) - Registered ${platformName}->${connectTarget}: ${eventCategories.join(', ')}`
        );

        ctx.broker.emit('api.socket-used', { socketId });

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
      tags: {
        params: true,
        meta: true
      },
      params: {
        platformName: VALIDATOR_PLATFORMS,
        connectTarget: 'string'
      },
      async handler(ctx) {
        let { platformName, connectTarget } = ctx.params;
        const socketId = ctx.meta.$socketId;

        connectTarget = connectTarget.toLowerCase();

        const { socketIdPlatformConnectTargetMap, socketIdConnectTargets } = getConnectTargetInfoOnPlatformForSocketId(
          socketId,
          platformName
        );

        // Can't unregister something we're not registered for!
        if (false === socketIdConnectTargets.has(connectTarget)) {
          const errMsg = `${platformName}->${connectTarget} was never registered for this client!`;

          this.logger.warn(errMsg);

          return {
            unregistered: false,
            error: errMsg,
            type: 'messaging',
            pubsub: {
              connectTarget,
              platformName
            }
          };
        }

        const shouldDisconnect = unregisterSocketFromConnectTargetAndPlatformName({
          platformName,
          socketId,
          connectTarget,
          socketIdPlatformConnectTargetMap,
          socketIdConnectTargets
        });

        this.logger.info(`PubSub Client (${socketId}) - Unregistered ${platformName}->${connectTarget}`);

        if (shouldDisconnect) {
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
      tags: {
        params: true,
        meta: true
      },
      params: {
        socketId: 'string'
      },
      async handler(ctx) {
        const socketId = ctx.params.socketId;

        const socketIdPlatformMap = getConnectTargetMapForSocketId(socketId);

        const socketIdPlatforms = socketIdPlatformMap.keys();

        if (0 === socketIdPlatformMap.size) {
          return this.logger.info(`No PubSubs Registered for Socket ID: ${ctx.params.socketId}, nothing to clean up!`);
        }

        // Iterate each platformName
        for (let platformName of socketIdPlatforms) {
          const connectionTargets = socketIdPlatformMap.get(platformName);

          // Iterate each connectionTarget on platformName
          for (let connectTarget of connectionTargets) {
            // Delegate unregister to our Action!

            // prettier-ignore
            await ctx.call(
              'gh-pubsub.unregister',
              { platformName, connectTarget },
              { meta: { $socketId: socketId } }
            );
          }
        }

        this.logger.info(`Unregistered ALL PubSubs for Socket ID: ${ctx.params.socketId}`);
      }
    },

    simulate: {
      params: {
        platformName: VALIDATOR_PLATFORMS,
        connectTarget: 'string',
        platformEventName: 'string',
        platformEventData: 'any'
      },

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
    async 'gh-pubsub.unregisterAll'(ctx) {
      await this.actions.unregisterAll(ctx.params);
    },

    // On gh-chat.evented, proxy to known socketIds as socket.io rooms
    'gh-chat.evented': {
      params: {
        platform: {
          $$type: 'object',
          name: VALIDATOR_PLATFORMS,
          eventName: 'string',
          eventData: 'any'
        },
        eventClassification: {
          $$type: 'object',
          category: {
            type: 'string',
            enum: EventClassifications
          },
          subCategory: 'string|optional'
        },
        connectTarget: 'string',
        timestamp: 'number',
        eventData: 'any|optional'
      },

      /**
       * @param {Context<import('golden-hammer-shared').NormalizedMessagingEvent>} ctx
       */

      handler(ctx) {
        const {
          connectTarget,
          eventClassification,
          platform: { name: platformName }
        } = ctx.params;

        const socketIdsAwaitingThisEvent = getSocketIdsForEventCategoryOnPlatformNameForConnectTarget({
          eventClassification,
          platformName,
          connectTarget
        });

        if (0 === socketIdsAwaitingThisEvent.length) {
          // this.logger.info(
          //   `No Clients listening for ${platformName}(${connectTarget})->${eventClassification.category}.${eventClassification.subCategory}`
          // );

          return;
        }

        this.logger.info(
          `Broadcasting to rooms (${platformName}(${connectTarget})->${eventClassification.category}.${eventClassification.subCategory}):`,
          socketIdsAwaitingThisEvent
        );

        ctx.broker.call('api.broadcast', {
          event: 'gh-chat.evented',
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
