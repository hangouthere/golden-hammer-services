const EventNormalizeMap = require('./EventNormalizeMap');

module.exports = class Normalizer {
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

    if (Normalizer) {
      const normalizeSubContext = Normalizer({
        incomingEventName,
        incomingEventArguments
      });

      ({ timestamp, normalizedData } = normalizeSubContext);
    } else {
      console.warn("!!!!!!!!! NOT NORMALIZED (We shouldn't be seeing this)", incomingEventName, incomingEventArguments);
      timestamp = Date.now();
      normalizedData = incomingEventArguments;
    }

    return {
      timestamp,
      eventClassification: EventClassification,
      normalizedData
    };
  }
};
