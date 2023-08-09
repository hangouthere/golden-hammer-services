import type { PubSubEvent } from 'golden-hammer-shared';
import type { Redis } from 'ioredis';
import type { Cachers } from 'moleculer';
import { hasListener } from './RegisterCache.js';
import type { TwitchChatServiceSchema } from './types.js';

const Methods: Partial<TwitchChatServiceSchema> = {
  methods: {
    async eventIRCEvent(eventName, ...eventData) {
      const [channel] = eventData;
      const cacher = this.broker.cacher as Cachers.Redis<Redis>;
      const connectTarget = (channel as string).replace('#', '');

      const _hasListener = await hasListener(cacher, { connectTarget, eventName });

      if (!_hasListener) {
        return this.logger.debug(`No Listeners for this event: (${eventName}) ${connectTarget}`);
      }

      this.logger.debug(`Incoming Data: (${eventName}) ${channel} ->`, eventData);

      const normalizedContext = this.normalizer?.normalize({
        eventName: eventName,
        eventData
      });

      const { timestamp, eventClassification, normalizedData } = normalizedContext as PubSubEvent;

      const normalizedEvent: PubSubEvent = {
        timestamp,
        pubSubMsgId: 'INVALID_MSG_ID',
        eventClassification,
        normalizedData,
        platformEvent: {
          platformName: 'twitch',
          connectTarget,
          eventName,
          eventData
        }
      };

      // Emit the normalized data as a generic `gh-messaging.evented` message!
      this.broker.emit('gh-messaging.evented', normalizedEvent);
    }
  }
};

export default Methods;
