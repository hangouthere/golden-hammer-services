/* istanbul ignore file */

import type { EventClassification } from 'golden-hammer-shared';
import type AbstractNormalizer from './AbstractNormalizer.js';
import {
  AdministrationBanNormalizer,
  AdministrationMsgRemovalNormalizer,
  AdministrationTimeoutNormalizer
} from './AdministrationNormalizer.js';
import {
  MonetizationCheerNormalizer,
  MonetizationReSubcriptionNormalizer,
  MonetizationSubGiftRecieveNormalizer,
  MonetizationSubGiftSendNormalizer,
  MonetizationSubcriptionNormalizer
} from './MonetizationNormalizer.js';
import ProxyNormalizerClass from './ProxyNormalizer.js';
import {
  JoinPartNormalizer as JoinPartNormalizerClass,
  UserChatMessageNormalizer as UserChatMessageNormalizerClass
} from './UserChatMessageNormalizer.js';

const ProxyNormalizer = new ProxyNormalizerClass();
const UserChatMessageNormalizer = new UserChatMessageNormalizerClass();
const JoinPartNormalizer = new JoinPartNormalizerClass();

type EventMap = {
  EventClassification: EventClassification;
  Normalizer: AbstractNormalizer['normalize'];
};

type NormalizeMap = Record<string, EventMap>;

const JoinPartNormalizeMap: EventMap = {
  EventClassification: 'UserChat.Presence',
  Normalizer: JoinPartNormalizer.normalize
};

const MessageNormalizeMap: EventMap = {
  EventClassification: 'UserChat.Message',
  Normalizer: UserChatMessageNormalizer.normalize
};

const EventNormalizeMap: NormalizeMap = {
  //! ///////////////////////////////////////////////////////
  //! UserChat
  // 'message', // Preferring action/chat/whisper explicitly
  action: MessageNormalizeMap,
  chat: MessageNormalizeMap,
  join: JoinPartNormalizeMap,
  part: JoinPartNormalizeMap,
  whisper: MessageNormalizeMap, // TODO: Determine if there's anything special we need to do for this

  //! ///////////////////////////////////////////////////////
  //! Monetization
  // anongiftpaidupgrade,
  // giftpaidupgrade,

  cheer: {
    EventClassification: 'Monetization.Tip',
    Normalizer: new MonetizationCheerNormalizer().normalize
  },
  subscription: {
    EventClassification: 'Monetization.Subscription',
    Normalizer: new MonetizationSubcriptionNormalizer().normalize
  },
  resub: {
    EventClassification: 'Monetization.Subscription',
    Normalizer: new MonetizationReSubcriptionNormalizer().normalize
  },
  submysterygift: {
    EventClassification: 'Monetization.Subscription',
    Normalizer: new MonetizationSubGiftSendNormalizer().normalize
  },
  subgift: {
    EventClassification: 'Monetization.Subscription',
    Normalizer: new MonetizationSubGiftRecieveNormalizer().normalize
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
    Normalizer: new AdministrationTimeoutNormalizer().normalize
  },
  ban: {
    EventClassification: 'Administration.Ban',
    Normalizer: new AdministrationBanNormalizer().normalize
  },
  messagedeleted: {
    EventClassification: 'Administration.MessageRemoval',
    Normalizer: new AdministrationMsgRemovalNormalizer().normalize
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

export default EventNormalizeMap;
