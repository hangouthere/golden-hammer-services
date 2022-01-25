module.exports = {
  name: 'pubsub',
  actions: {
    register: {
      tags: {
        params: true,
        meta: false
      },
      params: {
        platform: { type: 'string', enum: ['twitch'] },
        channelName: { type: 'string' },
        platformEventNames: 'string[]'
      },
      async handler(ctx) {
        let retVal;

        try {
          retVal = await ctx.call('twitch-chat.joinChannel', { channelName });
        } catch (error) {
          return next({
            error
          });
        }

        ctx.logger.info('PubSub to Channel Established:', channelName);

        return next({
          response: retVal,
          error: false
        });
      }
    }
  }
};
