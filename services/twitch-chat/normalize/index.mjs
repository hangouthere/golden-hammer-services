import EventNormalizeMap from './EventNormalizeMap.mjs';

export default class Normalizer {
  normalize(incomingEventName, incomingEventArguments) {
    /** @type {import('golden-hammer-shared').EventDataTypes} */
    let normalizedData, timestamp;

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

    ({ timestamp, normalizedData } = normalizeSubContext);

    return {
      timestamp,
      eventClassification: EventClassification,
      normalizedData
    };
  }
};
