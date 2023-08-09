import type { PlatformEvent } from 'golden-hammer-shared';
import AbstractNormalizer from './AbstractNormalizer.js';
import EventNormalizeMap from './EventNormalizeMap.js';

export default class NormalizerFacade extends AbstractNormalizer {
  override normalize({ eventName, eventData }: Partial<PlatformEvent>) {
    // Get our Classification mapping and build the object
    const MappingInfo = EventNormalizeMap[eventName as string];

    if (!MappingInfo) {
      throw new Error('Invalid Event Type for Processing: ' + eventName + ' ' + JSON.stringify(eventData));
    }

    const { EventClassification, Normalizer } = MappingInfo;

    if (!Normalizer) {
      throw new Error('Normalizer missing! If you want to simply proxy this event, use the ProxyNormalizer.');
    }

    const normalizeSubContext = Normalizer({
      eventName,
      eventData
    });

    const { timestamp, normalizedData } = normalizeSubContext;

    return {
      timestamp,
      eventClassification: EventClassification,
      normalizedData
    };
  }
}
