module.exports = class AdministrationNormalizer {
  _ts = us => +us['tmi-sent-ts'];

  normalizeTimeout = ({ incomingEventArguments }) => {
    const [userName, _null, duration, userState] = incomingEventArguments;

    return {
      timestamp: this._ts(userState),

      /** @type {import('golden-hammer-shared').AdministrationEventData} */
      normalizedData: {
        userName,
        duration,
        targetId: userState['target-user-id']
      }
    };
  };

  normalizeBan = ({ incomingEventArguments }) => {
    const [userName, _null, userState] = incomingEventArguments;

    return {
      timestamp: this._ts(userState),

      /** @type {import('golden-hammer-shared').AdministrationEventData} */
      normalizedData: {
        userName,
        targetId: userState['target-user-id']
      }
    };
  };

  normalizeMessageRemoval = ({ incomingEventArguments }) => {
    const [userName, message, userState] = incomingEventArguments;

    return {
      timestamp: this._ts(userState),

      /** @type {import('golden-hammer-shared').AdministrationEventData} */
      normalizedData: {
        userName,
        removedMessage: message,
        targetId: userState['target-msg-id']
      }
    };
  };
};
