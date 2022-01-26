// ! FIXME Consider storing in redis/db
const socketPlatformEventMap = {};

module.exports = {
  name: 'gh-pubsub',

  actions: {
    unregister: {
      tags: {
        params: true,
        meta: true
      },
      params: {
        channelName: 'string',
        platform: { type: 'string', enum: ['twitch'] }
      },
      async handler(ctx) {
        const socketId = ctx.meta.$socketId;
        const { channelName, platform } = ctx.params;

        let retVal;

        switch (platform) {
          case 'twitch':
            //!FIXME - We may not want to part the channel, if other sockets are wanting to listen
            //!FIXME - We may need to do some fancy room things?
            retVal = await ctx.call('twitch-chat.partChannel', { channelName });
            break;
        }

        // ! FIXME : Better Check for errors??? (ie, is just a retVal valid, check for actual error codes?)

        if (retVal) {
          // Store Platform -> SOCKET_ID relation for desired event maps
          // Used later for filtering events
          socketPlatformEventMap[platform] = socketPlatformEventMap[platform] || [];
          delete socketPlatformEventMap[platform][socketId];

          this.logger.info('PubSub to Channel Invalidated:', channelName);
        }

        return retVal;
      }
    },
    register: {
      tags: {
        params: true,
        meta: true
      },
      params: {
        channelName: 'string',
        platform: { type: 'string', enum: ['twitch'] },
        platformEventNames: 'string[]'
      },
      async handler(ctx) {
        const socketId = ctx.meta.$socketId;
        const { channelName, platform, platformEventNames } = ctx.params;

        let retVal;

        switch (platform) {
          case 'twitch':
            retVal = await ctx.call('twitch-chat.joinChannel', { channelName });
            break;
        }

        // ! FIXME : Better Check for errors??? (ie, is just a retVal valid, check for actual error codes?)

        if (retVal) {
          // Store SOCKET_ID -> Platform relation for desired event maps
          // Used later for filtering events
          socketPlatformEventMap[socketId] = socketPlatformEventMap[socketId] || {};
          socketPlatformEventMap[socketId][platform] = platformEventNames;

          this.logger.info(`PubSub to '${platform}' Established for Channel '${channelName}': ${platformEventNames}`);
        }

        return retVal;
      }
    }
  },

  events: {
    'gh-pubsub.unregisterAll'(ctx) {
      delete socketPlatformEventMap[ctx.params.socketId];

      this.logger.info(`PubSub Unregistered for ALL Namespaces for socketId: ${ctx.params.socketId}`);
    },

    'gh-chat.evented'(ctx) {
      const { eventName, platform } = ctx.params;

      const socketIdList = Object.keys(socketPlatformEventMap);
      let platformEventMap;

      const socketIdsAwaitingThisEvent = socketIdList.reduce((_socketIds, socketId) => {
        platformEventMap = socketPlatformEventMap[socketId][platform] || [];

        if (platformEventMap.includes(eventName)) {
          _socketIds.push(socketId);
        }

        return _socketIds;
      }, []);

      if (0 === socketIdsAwaitingThisEvent.length) {
        this.logger.info(`No Clients listening for ${platform}->${eventName}`);

        return;
      }

      this.logger.info(`Broadcasting to rooms (${platform}->${eventName}):`, socketIdsAwaitingThisEvent);

      ctx.broker.call('api.broadcast', {
        //namespace: '/pubsub', // ! FIXME Do we want namespaces???
        event: 'gh-chat.evented',
        args: [ctx.params],
        rooms: socketIdsAwaitingThisEvent
        //   volatile: true, //optional
        //   local: true, //optional
      });
    }
  }
};
