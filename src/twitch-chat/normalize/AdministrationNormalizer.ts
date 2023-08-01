import type { AdministrationNormalizedData } from 'golden-hammer-shared';
import { type Events } from 'tmi.js';
import AbstractNormalizer, { type NormalizedEvent, type NormalizeParams } from './AbstractNormalizer.js';

export class AdministrationTimeoutNormalizer extends AbstractNormalizer {
  override normalize = ({ incomingEventArguments }: NormalizeParams): NormalizedEvent<AdministrationNormalizedData> => {
    const [_channel, userName, _reason, duration, userState] = incomingEventArguments as Parameters<Events['timeout']>;

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

export class AdministrationBanNormalizer extends AbstractNormalizer {
  override normalize = ({ incomingEventArguments }: NormalizeParams): NormalizedEvent<AdministrationNormalizedData> => {
    const [_channel, userName, _reason, userState] = incomingEventArguments as Parameters<Events['ban']>;

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        userName,
        targetId: userState['target-user-id']
      }
    };
  };
}

export class AdministrationMsgRemovalNormalizer extends AbstractNormalizer {
  override normalize = ({ incomingEventArguments }: NormalizeParams): NormalizedEvent<AdministrationNormalizedData> => {
    const [_channel, userName, removedMessage, userState] = incomingEventArguments as Parameters<
      Events['messagedeleted']
    >;

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
