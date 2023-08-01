import type {
  EmoteRange,
  MessageChunk,
  MessageIterateMetaData,
  URIRange,
  UserChatMessageNormalizedData,
  UserRoles,
  WordChunkIterateMetaData
} from 'golden-hammer-shared';
import type { ChatUserstate, Events } from 'tmi.js';
import AbstractNormalizer, { type NormalizeParams, type NormalizedEvent } from './AbstractNormalizer.js';

const genEmoteId = (emoteId: string) => `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`;

export class JoinPartNormalizer extends AbstractNormalizer {
  override normalize = ({incomingEventName: presence, incomingEventArguments}: NormalizeParams): NormalizedEvent<UserChatMessageNormalizedData> => {
    const [_channel, userName, _self] = incomingEventArguments as (Parameters<Events['join']> | Parameters<Events['part']>);

    return {
      timestamp: Date.now(),
      normalizedData: {
        userName,
        presence
      }
    };
  }
}


export class UserChatMessageNormalizer extends AbstractNormalizer {
  override normalize = ({
    incomingEventArguments
  }: NormalizeParams): NormalizedEvent<UserChatMessageNormalizedData> => {
    const [_channel, userState, message] = incomingEventArguments as Parameters<Events['chat']>;
    const { userName, roles } = this._extractUserAndRoles(userState);

    // Get URL Indices before any modification
    const uriIndices = this._getUriRanges(message);
    const emoteIndices = this._getEmoteRanges(userState);

    return {
      timestamp: this._ts(userState),

      normalizedData: {
        userName,
        roles,
        userId: userState['user-id'],
        messageId: userState.id,
        messageBuffers: this._iterateMessage({ message, uriIndices, emoteIndices })
      }
    };
  };

  _extractUserAndRoles(userState: ChatUserstate) {
    const roles: UserRoles = userState['user-type'] ? [userState['user-type']] : [];

    if (userState.subscriber) {
      roles.push('subscriber');
    }

    return {
      userName: userState['display-name'] ?? 'No Display Name',
      roles
    };
  }

  _getUriRanges(message: string) {
    const UriSearch =
      /(?:(https?):\/\/(?:www\.)?|www\.)((?:(?:[-\w]+\.)+)[-\w]+)(?::\d+)?(?:\/((?:[-a-zA-Z;./\d#:_?=&,+%]*)))?/g;

    const matches = message.match(UriSearch);

    if (!matches) {
      return [];
    }

    return matches.map(uri => {
      const start = message.indexOf(uri);

      return {
        start,
        end: start + uri.length - 1,
        uri
      };
    }) as URIRange[];
  }

  _getEmoteRanges({ emotes }: ChatUserstate) {
    if (!emotes) {
      return [];
    }

    const entries = Object.entries(emotes);
    const emoteRanges: EmoteRange[] = [];

    entries.forEach(entry => {
      const [emoteId, emoteIndices] = entry;

      emoteIndices.forEach(_range => {
        const [start, end] = _range.split('-');

        emoteRanges.push({
          start: +start,
          end: +end,
          emoteId
        });
      });
    });

    emoteRanges.sort((a, b) => a.start - b.start);

    return emoteRanges;
  }

  _iterateMessage({ message, uriIndices, emoteIndices }: MessageIterateMetaData) {
    const wordChunks = message.split(' ');

    // using Extended_Pictographic instead of Emoji to not match numbers, see: https://stackoverflow.com/a/64396666
    const unicodeRegexp = /\p{Extended_Pictographic}/gu;
    let charOffset = 0,
      msgIdx = 0,
      _matches;

    return wordChunks.map(wordChunk => {
      unicodeRegexp.lastIndex = 0;
      // Find wordChunk position in the message, and apply Offset for emoji count
      msgIdx = message.indexOf(wordChunk);

      const chunkType = this._determineChunk({
        uriIndices,
        emoteIndices,
        msgIdx,
        charOffset,
        wordChunk
      });

      _matches = wordChunk.match(unicodeRegexp);
      charOffset += _matches?.length || 0;

      return chunkType;
    });
  }

  _determineChunk({ uriIndices, emoteIndices, msgIdx, charOffset, wordChunk }: WordChunkIterateMetaData) {
    const emoteIdx = emoteIndices.find(emoteIdx => emoteIdx.start === msgIdx - charOffset);
    const uriIdx = !emoteIdx && uriIndices.find(uriIdx => uriIdx.start === msgIdx);

    let retVal: Partial<MessageChunk> = {};

    if (emoteIdx) {
      retVal = {
        type: 'emote',
        content: wordChunk,
        meta: {
          emoteId: emoteIdx.emoteId,
          uri: genEmoteId(emoteIdx.emoteId)
        }
      };
    } else if (uriIdx) {
      retVal = {
        type: 'uri',
        content: wordChunk
      };
    } else {
      retVal = {
        type: 'word',
        content: wordChunk
      };
    }

    return retVal as MessageChunk;
  }
}
