const AdministrationNormalizerClass = require('./AdministrationNormalizer');
const MonetizationNormalizerClass = require('./MonetizationNormalizer');
const UserChatMessageNormalizer = require('./UserChatMessageNormalizer');

const AdministrationNormalizer = new AdministrationNormalizerClass();
const MonetizationNormalizer = new MonetizationNormalizerClass();

const JoinPart = {
  EventClassification: {
    category: 'UserChat',
    subCategory: 'Presence'
  },
  Normalizer: ({ incomingEventName: presence, incomingEventArguments }) => {
    let [userName] = incomingEventArguments;

    return {
      timestamp: Date.now(),

      /** @type {import('globals').UserChatEventData} */
      normalizedData: {
        userName,
        presence
      }
    };
  }
};

const Message = {
  EventClassification: {
    category: 'UserChat',
    subCategory: 'Message'
  },
  Normalizer: new UserChatMessageNormalizer().normalize
};

const MonetizationSubscriptionClassification = {
  EventClassification: {
    category: 'Monetization',
    subCategory: 'Subscription'
  }
};

module.exports = {
  //! ///////////////////////////////////////////////////////
  //! UserChat
  // 'message', // Preferring action/chat/whisper independently
  action: Message,
  chat: Message,
  join: JoinPart,
  part: JoinPart,
  whisper: Message, // TODO: Determine if there's anything special we need to do for this

  //! ///////////////////////////////////////////////////////
  //! Monetization
  // anongiftpaidupgrade,
  // giftpaidupgrade,

  cheer: {
    EventClassification: {
      category: 'Monetization',
      subCategory: 'Tip'
    },
    Normalizer: MonetizationNormalizer.normalizeCheer
  },
  subscription: {
    ...MonetizationSubscriptionClassification,
    Normalizer: MonetizationNormalizer.normalizeSubscription
  },
  resub: {
    ...MonetizationSubscriptionClassification,
    Normalizer: MonetizationNormalizer.normalizeResub
  },
  submysterygift: {
    ...MonetizationSubscriptionClassification,
    Normalizer: MonetizationNormalizer.normalizeSubgiftSend
  },
  subgift: {
    ...MonetizationSubscriptionClassification,
    Normalizer: MonetizationNormalizer.normalizeSubgiftRecieve
  },

  //! ///////////////////////////////////////////////////////
  //! Administration
  /**
  mod: {
    EventClassification: {
      category: 'Administration',
      subCategory: ''
    },
    Normalizer: () => {}
  },
  mods: {
    EventClassification: {
      category: 'Administration',
      subCategory: ''
    },
    Normalizer: () => {}
  },
  unmod: {
    EventClassification: {
      category: 'Administration',
      subCategory: ''
    },
    Normalizer: () => {}
  },
  vips: {
    EventClassification: {
      category: 'Administration',
      subCategory: ''
    },
    Normalizer: () => {}
  },
*/

  timeout: {
    EventClassification: {
      category: 'Administration',
      subCategory: 'Timeout'
    },
    Normalizer: AdministrationNormalizer.normalizeTimeout
  },
  ban: {
    EventClassification: {
      category: 'Administration',
      subCategory: 'Ban'
    },
    Normalizer: AdministrationNormalizer.normalizeBan
  },
  messagedeleted: {
    EventClassification: {
      category: 'Administration',
      subCategory: 'MessageRemoval'
    },
    Normalizer: AdministrationNormalizer.normalizeMessageRemoval
  }

  //! ///////////////////////////////////////////////////////
  //! System
  // 'connecting',
  // 'logon',
  // 'raw_message',
  // 'connected',
  // 'disconnected',
  // 'notice',
  // 'ping',
  // 'pong',
  // 'reconnect',
  // 'serverchange'

  //! ///////////////////////////////////////////////////////
  //! PlatformSpecific
  // 'emotesets', // Don't need for bot system
  // hosting // might be if bot host
  // unhost // might be if bot host
  // clearchat
  // r9kbeta:
  // emoteonly
  // followersonly
  // subscribers
  // slowmode
  // hosted
  // raided
  // roomstate
};
