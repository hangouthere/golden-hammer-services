module.exports = {
  MIXIN: {
    actions: {
      joinChannel: {
        params: {
          connectTarget: 'string'
        }
      }
    },
    partChannel: {
      params: {
        connectTarget: 'string'
      }
    }
  },

  EVENTS: {
    events: {
      'twitch-chat.simulate': {
        params: {
          connectTarget: 'string',
          platformEventName: 'string',
          platformEventData: 'any'
        }
      }
    }
  }
};
