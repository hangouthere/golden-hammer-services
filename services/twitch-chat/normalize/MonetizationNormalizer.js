module.exports = class MonetizationNormalizer {
  _ts = us => +us['tmi-sent-ts'];

  normalizeCheer = ({ incomingEventArguments }) => {
    const [userState, message] = incomingEventArguments;
    const sourceUserName = userState['display-name'];
    const bitValue = +userState.bits / 100;

    return {
      timestamp: this._ts(userState),

      /** @type {import('globals').MonetizationEventData} */
      normalizedData: {
        message,
        sourceUserName,
        estimatedValue: bitValue
      }
    };
  };

  normalizeSubscription = ({ incomingEventArguments }) => {
    const [sourceUserName, planInfo, _, userState] = incomingEventArguments;
    const duration = (planInfo.prime ? 1 : +userState['msg-param-months']) || 1;
    const subPlan = userState['msg-param-sub-plan'];

    return {
      timestamp: this._ts(userState),

      /** @type {import('globals').MonetizationEventData} */
      normalizedData: {
        duration,
        sourceUserName,
        estimatedValue: this._estimateValue(subPlan, duration)
      }
    };
  };

  normalizeResub = ({ incomingEventArguments }) => {
    const [sourceUserName, _streak, message, userState, planInfo] = incomingEventArguments;
    const duration = (planInfo.prime ? 1 : +userState['msg-param-months']) || 1;
    const subPlan = userState['msg-param-sub-plan'];

    return {
      timestamp: this._ts(userState),

      /** @type {import('globals').MonetizationEventData} */
      normalizedData: {
        duration,
        sourceUserName,
        message,
        estimatedValue: this._estimateValue(subPlan, duration)
      }
    };
  };

  normalizeSubgiftSend = ({ incomingEventArguments }) => {
    const [sourceUserName, duration, _planInfo, userState] = incomingEventArguments;
    const message = userState['system-msg'];
    const subPlan = userState['msg-param-sub-plan'];

    return {
      timestamp: this._ts(userState),

      /** @type {import('globals').MonetizationEventData} */
      normalizedData: {
        message,
        sourceUserName,
        estimatedValue: this._estimateValue(subPlan, duration)
      }
    };
  };

  normalizeSubgiftRecieve = ({ incomingEventArguments }) => {
    const [sourceUserName, _streak, userName, planInfo, userState] = incomingEventArguments;
    const message = userState['system-msg'];
    const duration = (planInfo.prime ? 1 : +userState['msg-param-months']) || 1;

    return {
      timestamp: this._ts(userState),

      /** @type {import('globals').MonetizationEventData} */
      normalizedData: {
        message,
        sourceUserName,
        targetUserName: userName,
        estimatedValue: this._estimateValue(userState['msg-param-sub-plan'], duration)
      }
    };
  };

  _estimateValue(type, duration) {
    const valueMap = {
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
  }
};
