const normalizerClass = require('-/twitch-chat/normalize/UserChatMessageNormalizer');

const MOCK_DATA = {
  uriIndices: [
    {
      end: 30,
      start: 8,
      uri: 'https://www.nfgarmy.com'
    }
  ],
  emoteIndices: [
    {
      emoteId: 'emotesv2_63f57029a4a94135b4013b73610ca192',
      end: 25,
      start: 11
    },
    {
      emoteId: 'emotesv2_bb24357392fa4d7c905309fb27402ea4',
      end: 46,
      start: 36
    },
    {
      emoteId: 'emotesv2_76f0794a7be343daa2f4d571861a9a3e',
      end: 58,
      start: 48
    }
  ]
};

describe('Twitch Chat: Normalizer - UserChatMessageNormalizer', () => {
  let normalizer;

  beforeEach(() => {
    normalizer = new normalizerClass();
  });

  describe('Extracts Username & Roles', () => {
    it('should extract the username', () => {
      const retVal = normalizer._extractUserAndRoles({
        'display-name': 'fakeUser',
        'user-type': 'mod'
      });

      expect(retVal).toMatchSnapshot();
    });

    it('should extract the subscriber role', () => {
      const retVal = normalizer._extractUserAndRoles({
        'display-name': 'fakeUser',
        subscriber: true
      });

      expect(retVal).toMatchSnapshot();
    });
  });

  describe('Determines URI Ranges', () => {
    it('Handles no URIs found', () => {
      const retVal = normalizer._getUriRanges('No URIs Found in the Message!');

      expect(retVal).toEqual([]);
    });

    it('Finds Simple URIs', () => {
      const retVal = normalizer._getUriRanges('Simple: https://www.nfgarmy.com');

      expect(retVal).toEqual(MOCK_DATA.uriIndices);
    });

    it('Finds Complex URIs', () => {
      const retVal = normalizer._getUriRanges(
        'Complex: https://www.amazon.com/LEGO-Classic-Large-Creative-Brick/dp/B00NHQF6MG/ref=sr_1_2?crid=19YPHSXDE0E0R&keywords=lego+kit&qid=1649711414&sprefix=lego+kit%2Caps%2C100&sr=8-2'
      );

      expect(retVal).toMatchSnapshot();
    });
  });

  describe('Determines Emote Ranges', () => {
    it("should noop if there aren't any emotes", () => {
      expect(normalizer._getEmoteRanges({})).toEqual([]);
    });

    it('should extract Emotes into expected format', () => {
      const retVal = normalizer._getEmoteRanges({
        emotes: {
          emotesv2_63f57029a4a94135b4013b73610ca192: ['11-25'],
          emotesv2_76f0794a7be343daa2f4d571861a9a3e: ['48-58'],
          emotesv2_bb24357392fa4d7c905309fb27402ea4: ['36-46']
        }
      });

      expect(retVal).toEqual(MOCK_DATA.emoteIndices);
    });

    it('should extract Emotes into sorted order', () => {
      const retVal = normalizer._getEmoteRanges({
        emotes: {
          1003187: ['60-69'],
          1003189: ['71-80'],
          306340318: ['0-9'],
          emotesv2_7c4aed2ad1a047d584ea282d37f65a68: ['27-34'],
          emotesv2_63f57029a4a94135b4013b73610ca192: ['11-25'],
          emotesv2_76f0794a7be343daa2f4d571861a9a3e: ['48-58'],
          emotesv2_bb24357392fa4d7c905309fb27402ea4: ['36-46']
        }
      });

      expect(retVal).toMatchSnapshot();
      // Note that 306340318 should be the snapshot value, as it comes first
      expect(retVal[0]).toMatchSnapshot();
    });
  });

  describe('Determines Chunk Types', () => {
    it('should default to a "word" type', () => {
      const retVal = normalizer._determineChunk({
        uriIndices: [...MOCK_DATA.uriIndices],
        emoteIndices: [...MOCK_DATA.emoteIndices],
        msgIdx: 0,
        charOffset: 0,
        wordChunk: 'JustAWord'
      });

      expect(retVal).toEqual({
        type: 'word',
        content: 'JustAWord'
      });
    });

    it('should detect a URI type', () => {
      const retVal = normalizer._determineChunk({
        uriIndices: [...MOCK_DATA.uriIndices],
        emoteIndices: [...MOCK_DATA.emoteIndices],
        msgIdx: 8,
        charOffset: 0,
        wordChunk: 'someUrl'
      });

      expect(retVal).toMatchSnapshot();
    });

    it('should detect a Emote type', () => {
      const retVal = normalizer._determineChunk({
        uriIndices: [...MOCK_DATA.uriIndices],
        emoteIndices: [...MOCK_DATA.emoteIndices],
        msgIdx: 11,
        charOffset: 0,
        wordChunk: 'someEmote'
      });

      expect(retVal).toMatchSnapshot();
    });
  });

  describe('Message Iteration', () => {
    it('should operate on every possible word', () => {
      normalizer._determineChunk = vitest.fn();

      normalizer._iterateMessage({
        message: 'Possible 👨‍👨‍👧‍👧 Words',
        emoteIndices: [],
        uriIndices: []
      });

      expect(normalizer._determineChunk).toBeCalledTimes(3);

      expect(normalizer._determineChunk).toBeCalledWith({
        charOffset: 4, // <-- This is our test with unicode
        emoteIndices: [],
        msgIdx: 21,
        uriIndices: [],
        wordChunk: 'Words'
      });
    });
  });

  describe('Normalizing', () => {
    it('should return the standard data structure format', () => {
      normalizer._getUriRanges = vitest.fn();
      normalizer._getEmoteRanges = vitest.fn();
      normalizer._iterateMessage = vitest.fn();
      normalizer._extractUserAndRoles = vitest.fn().mockReturnValue({
        userName: 'mockUser',
        roles: []
      });

      const retVal = normalizer.normalize({
        incomingEventArguments: [{}, 'Message']
      });

      expect(retVal).toMatchSnapshot();
    });
  });
});
