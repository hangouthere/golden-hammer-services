import type { NormalizedEventDataTypes } from 'golden-hammer-shared';
import type { Userstate } from 'tmi.js';

export type NormalizeParams = {
  incomingEventName: string;
  incomingEventArguments: unknown;
};

export type NormalizedEvent<NormalizedDataType extends NormalizedEventDataTypes> = {
  timestamp: number;
  normalizedData: NormalizedDataType;
};

export default abstract class AbstractNormalizer<NormalizedEventType = NormalizedEvent<NormalizedEventDataTypes>> {
  protected _ts = (us: Userstate) => +(us['tmi-sent-ts'] ?? 0);

  normalize(_params: NormalizeParams): NormalizedEventType {
    throw new Error('This method needs to be implemented in a concrete class');
  }
}
