const normalizerClass = require('-/twitch-chat/normalize/MonetizationNormalizer');

const MOCK_DATA = {
  userState: {
    'tmi-sent-ts': '1649705365314'
  }
};
describe('Twitch Chat: Normalizer - Monetization', () => {
  let normalizer;

  beforeEach(() => {
    normalizer = new normalizerClass();
  });

  describe('Value Estimation', () => {
    it('should throw an error on invalid sub plan types', () => {
      expect(() => normalizer._estimateValue('invalidType', NaN)).toThrow();
    });

    it('should NOT throw an error on valid sub plan types', () => {
      expect(() => normalizer._estimateValue('Prime', 1)).not.toThrow();
    });

    it('should calculate plan types according to Twitch Tiers', () => {
      expect(normalizer._estimateValue('Prime', 2)).toBe(4.99);
      expect(normalizer._estimateValue('1000', 2)).toBe(4.99);
      expect(normalizer._estimateValue('2000', 2)).toBe(7.992000000000001);
      expect(normalizer._estimateValue('3000', 2)).toBe(14.993999999999998);
    });
  });

  describe('Normalizing', () => {
    beforeEach(() => {
      normalizer._estimateValue = vitest.fn().mockReturnValue(4.2);
    });

    it('should normalize a Cheer', () => {
      const normalized = normalizer.normalizeCheer({
        incomingEventArguments: [
          {
            ...MOCK_DATA.userState,
            'display-name': 'userCheer',
            bits: 5000
          },
          'Cheer Message'
        ]
      });

      expect(normalized).toMatchSnapshot();
    });

    it('should normalize a Subscription', () => {
      const normalized = normalizer.normalizeSubscription({
        incomingEventArguments: [
          'userSubscribed',
          { prime: true },
          'Sub Message',
          {
            ...MOCK_DATA.userState,
            'display-name': 'userCheer',
            'msg-param-sub-plan': 'Prime'
          }
        ]
      });

      expect(normalized).toMatchSnapshot();
    });

    it('should normalize a Resub', () => {
      const normalized = normalizer.normalizeResub({
        incomingEventArguments: [
          'userReSubscribed',
          null,
          'ReSub message',
          {
            ...MOCK_DATA.userState,
            'display-name': 'userResub',
            'msg-param-sub-plan': 'Prime'
          },
          { prime: true }
        ]
      });

      expect(normalized).toMatchSnapshot();
    });

    it('should normalize a SubGift Send', () => {
      const normalized = normalizer.normalizeSubgiftSend({
        incomingEventArguments: [
          'userSendingGift',
          1,
          null,
          {
            ...MOCK_DATA.userState,
            'system-msg': 'Sub Gift Msg',
            'msg-param-sub-plan': '2000'
          }
        ]
      });

      expect(normalized).toMatchSnapshot();
    });

    it('should normalize a SubGift Recieve', () => {
      const normalized = normalizer.normalizeSubgiftRecieve({
        incomingEventArguments: [
          'userSendingGift',
          null,
          'userRecievingGift',
          { prime: true },
          {
            ...MOCK_DATA.userState,
            'system-msg': 'Sub Recieve Msg',
            'msg-param-sub-plan': '2000'
          }
        ]
      });

      expect(normalized).toMatchSnapshot();
    });

    describe('Durations from input', () => {
      it('should test for msg-param-months', () => {
        let normalized = normalizer.normalizeSubscription({
          incomingEventArguments: [
            'userSubscribed',
            { prime: false },
            'Sub Message',
            {
              ...MOCK_DATA.userState,
              'display-name': 'userSub',
              'msg-param-sub-plan': '2000',
              'msg-param-months': 4
            }
          ]
        });

        expect(normalized).toMatchSnapshot();

        normalized = normalizer.normalizeResub({
          incomingEventArguments: [
            'userReSubscribed',
            null,
            'ReSub message',
            {
              ...MOCK_DATA.userState,
              'display-name': 'userResub',
              'msg-param-sub-plan': '2000',
              'msg-param-months': 4
            },
            { prime: false }
          ]
        });

        expect(normalized).toMatchSnapshot();

        normalized = normalizer.normalizeSubgiftRecieve({
          incomingEventArguments: [
            'userSendingGift',
            null,
            'userRecievingGift',
            { prime: false },
            {
              ...MOCK_DATA.userState,
              'system-msg': 'Sub Recieve Msg',
              'msg-param-sub-plan': '2000',
              'msg-param-months': 4
            }
          ]
        });
      });

      it('should fallback to 1 if no msg-param-months', () => {
        let normalized = normalizer.normalizeSubscription({
          incomingEventArguments: [
            'userSubscribed',
            { prime: false },
            'Sub Message',
            {
              ...MOCK_DATA.userState,
              'display-name': 'userSub',
              'msg-param-sub-plan': '2000'
            }
          ]
        });

        expect(normalized).toMatchSnapshot();

        normalized = normalizer.normalizeResub({
          incomingEventArguments: [
            'userReSubscribed',
            null,
            'ReSub message',
            {
              ...MOCK_DATA.userState,
              'display-name': 'userResub',
              'msg-param-sub-plan': '2000'
            },
            { prime: false }
          ]
        });

        expect(normalized).toMatchSnapshot();

        normalized = normalizer.normalizeSubgiftRecieve({
          incomingEventArguments: [
            'userSendingGift',
            null,
            'userRecievingGift',
            { prime: false },
            {
              ...MOCK_DATA.userState,
              'system-msg': 'Sub Recieve Msg',
              'msg-param-sub-plan': '2000'
            }
          ]
        });
      });
    });
  });
});
