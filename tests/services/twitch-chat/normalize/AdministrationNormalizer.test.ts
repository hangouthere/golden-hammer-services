import normalizerClass from '-/twitch-chat/normalize/AdministrationNormalizer';

const MOCK_DATA = {
  duration: 99,
  userState: {
    'tmi-sent-ts': '1649705365314',
    'target-user-id': 'targetUserId'
  }
};

describe('Twitch Chat: Normalizer - Administration', () => {
  let normalizer;

  beforeEach(() => {
    normalizer = new normalizerClass();
  });

  it('should normalize a Timeout', () => {
    const normalized = normalizer.normalizeTimeout({
      incomingEventArguments: ['userTimedout', null, MOCK_DATA.duration, MOCK_DATA.userState]
    });

    expect(normalized).toMatchSnapshot();
  });

  it('should normalize a Ban', () => {
    const normalized = normalizer.normalizeBan({
      incomingEventArguments: ['userBanned', null, MOCK_DATA.userState]
    });

    expect(normalized).toMatchSnapshot();
  });

  it('should normalize a Message Removal', () => {
    const normalized = normalizer.normalizeMessageRemoval({
      incomingEventArguments: [
        'userMessageRemoved',
        'removed message',
        { ...MOCK_DATA.userState, 'target-msg-id': 'targetMessageIdForRemoval' }
      ]
    });

    expect(normalized).toMatchSnapshot();
  });
});
