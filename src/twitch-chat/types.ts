import type { JSONArray } from '@hangouthere/util/index.js';
import type { ServiceSchema } from 'moleculer';
import type { Client } from 'tmi.js';
import type NormalizerFacade from './normalize/index.js';

type Methods = {
  eventIRCEvent: (
    this: TwitchChatServiceSchema,
    nativeEventName: string,
    ...incomingEventArguments: JSONArray
  ) => Promise<void> & ThisType<TwitchChatServiceSchema>;
};

export type TwitchChatServiceSchema = ServiceSchema & {
  methods?: ServiceSchema['methods'] & Methods;

  tmijs?: Client;
  normalizer?: NormalizerFacade;
} & ThisType<TwitchChatServiceSchema>;
