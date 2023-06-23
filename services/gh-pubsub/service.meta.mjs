import { PossibleEventClassifications } from 'golden-hammer-shared';

const VALIDATOR_PLATFORMS = { type: 'string', enum: ['twitch'] };

const TAGS = {
  params: true,
  meta: true
};

export default {
  MIXIN: {
    actions: {
      register: {
        tags: TAGS,
        params: {
          platformName: VALIDATOR_PLATFORMS,
          connectTarget: 'string',
          eventClassifications: 'string[]'
        }
      },

      unregister: {
        tags: TAGS,
        params: {
          platformName: VALIDATOR_PLATFORMS,
          connectTarget: 'string'
        }
      },

      unregisterAll: {
        tags: TAGS,
        params: {
          socketId: 'string'
        }
      },

      simulate: {
        params: {
          platformName: VALIDATOR_PLATFORMS,
          connectTarget: 'string',
          platformEventName: 'string',
          platformEventData: 'any'
        }
      }
    }
  },

  EVENTS: {
    'gh-messaging.evented': {
      params: {
        platform: {
          $$type: 'object',
          name: VALIDATOR_PLATFORMS,
          eventName: 'string',
          eventData: 'any'
        },
        eventClassification: {
          type: 'string',
          enum: PossibleEventClassifications
        },
        connectTarget: 'string',
        timestamp: 'number',
        eventData: 'any|optional'
      }
    }
  }
};
