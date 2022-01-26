// const REGEXP_WORD_SPLITTER = /\w*\s?/g;

class NormalizeMessageTwitch {
  buffers = [];

  _ltrIdx = 0;
  _curBuff;

  normalize(chatEvent, chatEventData) {
    //! FIXME Might need knowledge about platformEventName
    //! (ie, "chat", would need this existing normalizer, but others might just need a remapping? ex: )
    //! FIXME: Non-chat is just returned for now
    if ('chat' !== chatEvent) {
      return chatEventData;
    }

    const { userState } = chatEventData;

    // Get URL Indices before any modification
    userState.uriIndices = this._getUriRanges(chatEventData);
    userState.emoteIndices = this._getEmoteRanges(chatEventData);

    return {
      userName: userState['display-name'],
      messageBuffers: this._iterateMessage(chatEventData),
      originalEventData: chatEventData
    };
  }

  _getUriRanges({ message }) {
    const UriSearch = /(https?:\/\/(www\.)?)?[a-z0-9\-\.]+\.[a-z]{2,5}(:[0-9]{1,5})?[/a-z0-9]+/g;

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
    });
  }

  _getEmoteRanges({ userState: { emotes } }) {
    if (!emotes) {
      return [];
    }

    const entries = Object.entries(emotes);
    const emoteRanges = [];

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

  _iterateMessage({ userState, message }) {
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
        userState,
        msgIdx,
        charOffset,
        wordChunk
      });

      _matches = wordChunk.match(unicodeRegexp);
      charOffset += _matches?.length || 0;

      return chunkType;
    });
  }

  _determineChunk({ userState, msgIdx, charOffset, wordChunk }) {
    const emoteIdx = userState.emoteIndices.find(emoteIdx => emoteIdx.start === msgIdx - charOffset);
    const uriIdx = !emoteIdx && userState.uriIndices.find(uriIdx => uriIdx.start === msgIdx);

    let retVal = {};

    if (emoteIdx) {
      retVal = {
        type: 'emote',
        content: wordChunk,
        meta: {
          emoteId: emoteIdx.emoteId,
          uri: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteIdx.emoteId}/default/dark/3.0`
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

    return retVal;
  }
}

exports.NormalizeMessageTwitch = NormalizeMessageTwitch;
