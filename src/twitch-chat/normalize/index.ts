import type { PubSubEvent } from 'golden-hammer-shared';
import type { NormalizeParams } from './AbstractNormalizer.js';
import AbstractNormalizer from './AbstractNormalizer.js';
import EventNormalizeMap from './EventNormalizeMap.js';

export default class NormalizerFacade extends AbstractNormalizer<Partial<PubSubEvent>> {
  override normalize({ incomingEventName, incomingEventArguments }: NormalizeParams) {
    // Get our Classification mapping and build the object
    const MappingInfo = EventNormalizeMap[incomingEventName];

    if (!MappingInfo) {
      throw new Error(
        'Invalid Event Type for Processing: ' + incomingEventName + ' ' + JSON.stringify(incomingEventArguments)
      );
    }

    const { EventClassification, Normalizer } = MappingInfo;

    if (!Normalizer) {
      throw new Error('Normalizer missing! If you want to simply proxy this event, use the ProxyNormalizer.');
    }

    const normalizeSubContext = Normalizer({
      incomingEventName,
      incomingEventArguments
    });

    const { timestamp, normalizedData } = normalizeSubContext;

    return {
      timestamp,
      eventClassification: EventClassification,
      normalizedData
    };
  }
}
