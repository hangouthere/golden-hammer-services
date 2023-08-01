import type { MonetizationNormalizedData } from 'golden-hammer-shared';
import type { Events, SubMethod } from 'tmi.js';
import AbstractNormalizer, { type NormalizeParams, type NormalizedEvent } from './AbstractNormalizer.js';

const estimateValue = (type: SubMethod, duration: number) => {
  const valueMap: Record<SubMethod, number> = {
    Prime: 4.99 * 0.5,
    1000: 4.99 * 0.5,
    2000: 9.99 * 0.4,
    3000: 24.99 * 0.3
  };

  const rate = valueMap[type];

  if (!rate) {
    throw new Error('Invalid Plan Type:' + type);
  }

  return rate * duration;
};

export class MonetizationCheerNormalizer extends AbstractNormalizer {
  override normalize({ incomingEventArguments }: NormalizeParams): NormalizedEvent<MonetizationNormalizedData> {
    const [_channel, userState, message] = incomingEventArguments as Parameters<Events['cheer']>;
    const sourceUserName = userState['display-name'] as string;
    const bitValue = +(userState.bits as string) / 100;

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        message,
        sourceUserName,
        estimatedValue: bitValue
      }
    };
  }
}

export class MonetizationSubcriptionNormalizer extends AbstractNormalizer {
  override normalize({ incomingEventArguments }: NormalizeParams): NormalizedEvent<MonetizationNormalizedData> {
    const [_channel, sourceUserName, planInfo, message, userState] = incomingEventArguments as Parameters<
      Events['subscription']
    >;
    const duration = (planInfo.prime ? 1 : +userState['msg-param-months']) || 1;
    const subPlan = userState['msg-param-sub-plan'] as SubMethod;

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        duration,
        sourceUserName,
        message,
        estimatedValue: estimateValue(subPlan, duration)
      }
    };
  }
}

export class MonetizationReSubcriptionNormalizer extends AbstractNormalizer {
  override normalize({ incomingEventArguments }: NormalizeParams): NormalizedEvent<MonetizationNormalizedData> {
    const [_channel, sourceUserName, _streak, message, userState, planInfo] = incomingEventArguments as Parameters<
      Events['resub']
    >;
    const duration = (planInfo.prime ? 1 : +userState['msg-param-months']) || 1;
    const subPlan = userState['msg-param-sub-plan'] as SubMethod;

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        duration,
        sourceUserName,
        message,
        estimatedValue: estimateValue(subPlan, duration)
      }
    };
  }
}

export class MonetizationSubGiftSendNormalizer extends AbstractNormalizer {
  override normalize({ incomingEventArguments }: NormalizeParams): NormalizedEvent<MonetizationNormalizedData> {
    const [_channel, sourceUserName, numbOfSubs, subMethods, userState] = incomingEventArguments as Parameters<
      Events['submysterygift']
    >;

    const message = userState['system-msg'];

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        message,
        sourceUserName,
        estimatedValue: estimateValue(subMethods.plan as SubMethod, numbOfSubs)
      }
    };
  }
}

export class MonetizationSubGiftRecieveNormalizer extends AbstractNormalizer {
  override normalize({ incomingEventArguments }: NormalizeParams): NormalizedEvent<MonetizationNormalizedData> {
    const [_channel, sourceUserName, _streak, targetUserName, subMethods, userState] =
      incomingEventArguments as Parameters<Events['subgift']>;
    const message = userState['system-msg'];
    const duration = (subMethods.prime ? 1 : +(userState['msg-param-months'] as string)) || 1;

    return {
      timestamp: this._ts(userState),
      normalizedData: {
        message,
        sourceUserName,
        targetUserName,
        duration,
        estimatedValue: estimateValue(subMethods.plan as SubMethod, duration)
      }
    };
  }
}
