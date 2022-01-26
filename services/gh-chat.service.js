/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const CHAT_EVENTS = {
  TWITCH: 'twitch-chat.evented'
};

module.exports = {
  name: 'gh-chat',

  events: {
    /** @param {Context} ctx  */
    // Cleanup Twitch Chat event to Normalized Event, and re-event as `gh-chat.evented`
    async [CHAT_EVENTS.TWITCH](ctx) {
      const normalizeAction = ctx.eventName.replace('evented', 'normalize');
      const { platformEventName, platformEventData } = ctx.params;

      const eventData = await ctx.broker.call(normalizeAction, { platformEventName, platformEventData });

      ctx.emit('gh-chat.evented', {
        platform: 'twitch',
        eventName: platformEventName,
        eventData
      });
    }
  }
};
