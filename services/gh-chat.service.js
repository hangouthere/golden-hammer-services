const { TwitchMessageNormalizer } = require('../src/TwitchMessageNormalizer');

module.exports = {
  name: 'gh-chat',

  created() {
    this.msgBuilder = new TwitchMessageNormalizer();
  },

  actions: {
    normalize: {
      // rest: 'POST /normalize',
      params: {
        type: { type: 'string', enum: ['twitch'] },
        originalChatEventData: { type: 'any' }
      },
      async handler(ctx) {
        const { _type, originalChatEventData } = ctx.params;

        this.msgBuilder.normalize(originalChatEventData);
      }
    }
  },

  methods: {}
};
