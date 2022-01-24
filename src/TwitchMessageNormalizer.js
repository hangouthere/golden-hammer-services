// const REGEXP_WORD_SPLITTER = /\w*\s?/g;

class TwitchMessageNormalizer {
  buffers = [];

  _ltrIdx = 0;
  _curBuff;

  normalize(chatEventData) {
    const { userState } = chatEventData;

    // Get URL Indices before any modification
    userState.uriIndices = this._getUriRanges(chatEventData);
    userState.emoteIndices = this._getEmoteRanges(chatEventData);

    return this._iterateMessage(chatEventData);
  }

  _getUriRanges({ message }) {
    const UriSearch = /(https?:\/\/(www\.)?)?[a-z0-9\-\.]+\.[a-z]{2,5}(:[0-9]{1,5})?[/a-z0-9]+/g;

    const matches = message.match(UriSearch);

    if (!matches) {
      return [];
    }

    const start = message.indexOf(uri);

    return matches.map(uri => ({
      start,
      end: start + uri.length - 1,
      uri
    }));
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
    // const words = [...message.matchAll(REGEXP_WORD_SPLITTER)].slice(0, -1).map(find => find[0]);
    const words = message.split(' ');

    return words.map(this._determineChunk.bind(this, { userState, message }));
  }

  _determineChunk({ userState, message }, content) {
    const msgIdx = message.indexOf(content);
    const emoteIdx = userState.emoteIndices.find(emoteIdx => emoteIdx.start === msgIdx);
    const uriIdx = !emoteIdx && userState.uriIndices.find(uriIdx => uriIdx.start === msgIdx);

    let retVal = {};

    if (emoteIdx) {
      retVal = {
        type: 'emote',
        content,
        meta: {
          emoteId: emoteIdx.emoteId,
          uri: `https://static-cdn.jtvnw.net/emoticons/v1/${emoteIdx.emoteId}/2.0`
        }
      };
    } else if (uriIdx) {
      retVal = {
        type: 'uri',
        content
      };
    } else {
      retVal = {
        type: 'word',
        content
      };
    }

    return retVal;
  }
}
exports.TwitchMessageNormalizer = TwitchMessageNormalizer;
