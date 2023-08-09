import type { NormalizedEventDataTypes, PlatformEvent, PubSubEvent } from 'golden-hammer-shared';
import type { Userstate } from 'tmi.js';

export default abstract class AbstractNormalizer<NormalizedEventType = NormalizedEventDataTypes> {
  protected _ts = (us: Userstate) => +(us['tmi-sent-ts'] ?? 0);

  normalize(_params: Partial<PlatformEvent>): Partial<PubSubEvent<NormalizedEventType>> {
    throw new Error('This method needs to be implemented in a concrete class');
  }
}
