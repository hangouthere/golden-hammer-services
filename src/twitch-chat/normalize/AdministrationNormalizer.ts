import type { AdministrationNormalizedData, PlatformEvent, PubSubEvent } from 'golden-hammer-shared';
import { type Events } from 'tmi.js';
import AbstractNormalizer from './AbstractNormalizer.js';

export class AdministrationTimeoutNormalizer extends AbstractNormalizer<AdministrationNormalizedData> {
  override normalize = ({ eventData }: PlatformEvent) => {
    const [_channel, userName, _reason, duration, userState] = eventData as Parameters<Events['timeout']>;

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        userName,
        duration,
        targetId: userState['target-user-id']
      }
    };
  };
}

export class AdministrationBanNormalizer extends AbstractNormalizer<AdministrationNormalizedData> {
  override normalize({ eventData }: PlatformEvent): Partial<PubSubEvent<AdministrationNormalizedData>> {
    const [_channel, userName, _reason, userState] = eventData as Parameters<Events['ban']>;

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        userName,
        targetId: userState['target-user-id']
      }
    };
  }
}

export class AdministrationMsgRemovalNormalizer extends AbstractNormalizer<AdministrationNormalizedData> {
  override normalize = ({ eventData }: PlatformEvent): Partial<PubSubEvent<AdministrationNormalizedData>> => {
    const [_channel, userName, removedMessage, userState] = eventData as Parameters<Events['messagedeleted']>;

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        userName,
        removedMessage,
        targetId: userState['target-msg-id']
      }
    };
  };
}
