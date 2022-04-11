const normalizerClass = require('@/services/twitch-chat/normalize/ProxyNormalizer');

describe('Twitch Chat: Normalizer - Proxy', () => {
  let normalizer;

  beforeEach(() => {
    normalizer = new normalizerClass();
    normalizer._ts = 1234;
  });

  it('should normalize a Proxied event', () => {
    const userState = { eventName: 'eventName', prop: true, anotherProp: true };
    const normalized = normalizer.normalize(userState);

    expect(normalized).toMatchSnapshot();
  });

  it('should normalize an empty Proxied event', () => {
    const normalized = normalizer.normalize();

    expect(normalized).toMatchSnapshot();
  });
});
