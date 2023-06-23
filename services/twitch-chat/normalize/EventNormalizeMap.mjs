/* istanbul ignore file */

import AdministrationNormalizerClass from './AdministrationNormalizer.mjs';
import MonetizationNormalizerClass from './MonetizationNormalizer.mjs';
import ProxyNormalizerClass from './ProxyNormalizer.mjs';
import UserChatMessageNormalizer from './UserChatMessageNormalizer.mjs';

const AdministrationNormalizer = new AdministrationNormalizerClass();
const MonetizationNormalizer = new MonetizationNormalizerClass();
const ProxyNormalizer = new ProxyNormalizerClass();

const JoinPart = {
  EventClassification: 'UserChat.Presence',
  Normalizer: ({ incomingEventName: presence, incomingEventArguments }) => {
    let [userName] = incomingEventArguments;

    return {
      timestamp: Date.now(),

      /** @type {import('golden-hammer-shared').UserChatEventData} */
      normalizedData: {
        userName,
        presence
      }
    };
  }
};

const Message = {
  EventClassification: 'UserChat.Message',
  Normalizer: new UserChatMessageNormalizer().normalize
};

export default {
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
    EventClassification: 'Monetization.Tip',
    Normalizer: MonetizationNormalizer.normalizeCheer
  },
  subscription: {
    EventClassification: 'Monetization.Subscription',
    Normalizer: MonetizationNormalizer.normalizeSubscription
  },
  resub: {
    EventClassification: 'Monetization.Subscription',
    Normalizer: MonetizationNormalizer.normalizeResub
  },
  submysterygift: {
    EventClassification: 'Monetization.Subscription',
    Normalizer: MonetizationNormalizer.normalizeSubgiftSend
  },
  subgift: {
    EventClassification: 'Monetization.Subscription',
    Normalizer: MonetizationNormalizer.normalizeSubgiftRecieve
  },

  //! ///////////////////////////////////////////////////////
  //! Administration
  // ! FIXME - Needs rolechange event of some sort (should give entire role-set to not be confused)
  /**
  mod: {
    EventClassification: 'Administration.RoleChange',
    Normalizer: () => {}
  },
  mods: {
    EventClassification: 'Administration.RoleChange',
    Normalizer: () => {}
  },
  unmod: {
    EventClassification: 'Administration.RoleChange',
    Normalizer: () => {}
  },
  vips: {
    EventClassification: 'Administration.RoleChange',
    Normalizer: () => {}
  },
*/

  timeout: {
    EventClassification: 'Administration.Timeout',
    Normalizer: AdministrationNormalizer.normalizeTimeout
  },
  ban: {
    EventClassification: 'Administration.Ban',
    Normalizer: AdministrationNormalizer.normalizeBan
  },
  messagedeleted: {
    EventClassification: 'Administration.MessageRemoval',
    Normalizer: AdministrationNormalizer.normalizeMessageRemoval
  },

  //! ///////////////////////////////////////////////////////
  //! PlatformSpecific
  clearchat: {
    EventClassification: 'PlatformSpecific',
    Normalizer: ProxyNormalizer.normalize
  },

  emoteonly: {
    EventClassification: 'PlatformSpecific',
    Normalizer: ProxyNormalizer.normalize
  },
  subscribers: {
    EventClassification: 'PlatformSpecific',
    Normalizer: ProxyNormalizer.normalize
  },

  followersonly: {
    EventClassification: 'PlatformSpecific',
    Normalizer: ProxyNormalizer.normalize
  },
  slowmode: {
    EventClassification: 'PlatformSpecific',
    Normalizer: ProxyNormalizer.normalize
  },

  hosted: {
    EventClassification: 'PlatformSpecific',
    Normalizer: ProxyNormalizer.normalize
  },
  raided: {
    EventClassification: 'PlatformSpecific',
    Normalizer: ProxyNormalizer.normalize
  }
};
