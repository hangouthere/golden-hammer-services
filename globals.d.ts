export interface Platform {
  name: 'twitch'; // | 'discord' | 'youtube'; // Platform name, maps to which services to rely on
  eventName: String; // Original Event Name as it was received from the platform directly
  eventData: any; // Original Event Data as it was received from the platform directly
}

export interface EventClassification {
  category: 'UserChat' | 'Administration' | 'Monetization' | 'System' | 'PlatformSpecific';
  subCategory: any;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

declare namespace UserChatEventData {
  export interface EmoteMeta {
    emoteId: string;
    uri: string;
  }

  export interface MessageBuffer {
    // TODO: Consider UTF-8/etc extraction(s)?
    type: 'word' | 'emote' | 'uri';
    content: string;
    meta?: UserChatEventData.EmoteMeta;
  }
}

export interface UserChatEventClassification extends EventClassification {
  subCategory: 'Message' | 'Presence';
}

export interface UserChatEventData {
  userName: string;
  userId?: string; // Not on join/part
  messageId?: string; // Not on join/part
  roles?: string[]; // 'mod', 'sub', 'DiscordRoleName'
  messageBuffers?: UserChatEventData.MessageBuffer[];
  presence?: string | boolean; // indicates presence on a platform (ie, join|part, online|offline (as bool))
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface AdministrationEventClassification extends EventClassification {
  subCategory: 'Timeout' | 'Ban' | 'MessageRemoval';
}

export interface AdministrationEventData {
  userName: string; // Target userName
  roles?: string[]; // 'mod', 'sub', 'DiscordRoleName'
  removedMessage?: string; // Message that was removed
  targetId?: string; // Depends on subCategory| Timeout=userId, Ban=userId, MessageRemoval=messageId
  duration?: number; // If a duration is associated, we store it here
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface MonetizationEventClassification extends EventClassification {
  subCategory: 'Subscription' | 'Tip';
}

export interface MonetizationEventData {
  sourceUserName: string;
  targetUserName?: string;
  duration?: number;
  estimatedValue?: number;
  message?: string;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type EventClassificationTypes =
  | AdministrationEventClassification
  | MonetizationEventClassification
  | UserChatEventClassification;

export type EventDataTypes = AdministrationEventData | MonetizationEventData | UserChatEventData;

export interface NormalizedEvent {
  timestamp: number;
  platform: Platform;
  connectTarget: string; // ChannelName, Discord URI, etc?
  eventClassification: EventClassificationTypes;
  eventData: EventDataTypes;
}
