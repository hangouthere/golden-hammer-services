module.exports = {
  MIXIN: {
    actions: {
      joinChannel: {
        params: {
          connectTarget: 'string'
        }
      },
      partChannel: {
        params: {
          connectTarget: 'string'
        }
      },
      register: {
        params: {
          connectTarget: 'string',
          eventClassifications: 'string[]'
        }
      },
      unregister: {
        params: {
          connectTarget: 'string',
          eventClassifications: 'string[]'
        }
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
