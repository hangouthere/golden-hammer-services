import type { ClassificationsForTarget } from 'golden-hammer-shared';
import type { Redis } from 'ioredis';
import type { Cachers } from 'moleculer';
import EventDenormalizeMap from './normalize/EventDenormalizeMap.js';

export type HasListenerMap = {
  connectTarget: string;
  nativeEventName: string;
};

const KEY_PREFIX = 'twitchFilter';

// Based on classification, we toggle an event type (or explicitly set)
export const toggleEventTypesByClassifications = async (
  cacher: Cachers.Redis<Redis>,
  { connectTarget, eventClassifications }: ClassificationsForTarget,
  adding = true
) => {
  const key = `${cacher.prefix}${KEY_PREFIX}:${connectTarget}`;

  let nativeEventNames;

  for (let evtClassIdx = 0; evtClassIdx < eventClassifications.length; evtClassIdx++) {
    nativeEventNames = EventDenormalizeMap[eventClassifications[evtClassIdx]];

    for (let nativeClassIdx = 0; nativeClassIdx < nativeEventNames.length; nativeClassIdx++) {
      await cacher.client.hincrby(key, nativeEventNames[nativeClassIdx], adding ? 1 : -1);
    }
  }
};

export const hasListener = async (cacher: Cachers.Redis<Redis>, { connectTarget, nativeEventName }: HasListenerMap) => {
  const key = `${cacher.prefix}${KEY_PREFIX}:${connectTarget}`;

  const numListeningToEvent = Number(await cacher.client.hget(key, nativeEventName));

  return numListeningToEvent > 0;
};
