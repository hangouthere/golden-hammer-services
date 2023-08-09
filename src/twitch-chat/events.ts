import type { JSONArray } from '@hangouthere/util/index.js';
import type { PlatformEvent } from 'golden-hammer-shared';
import type { Context } from 'moleculer';
import type { TwitchChatServiceSchema } from './types.js';

const Events: Partial<TwitchChatServiceSchema> = {
  events: {
    'twitch-chat.simulate': {
      params: {
        connectTarget: 'string',
        platformEventName: 'string',
        platformEventData: 'any[]'
      },
      async handler(ctx: Context<PlatformEvent>) {
        const { connectTarget, eventName, eventData } = ctx.params;
        const serviceMethod = this as unknown as TwitchChatServiceSchema['methods'];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceMethod?.eventIRCEvent.call(this, eventName, `#${connectTarget}`, ...(eventData as JSONArray));
      }
    }
  }
};

export default Events;
