describe('Twitch Chat: Register Cache', () => {
  let registerCache, cacherMock;

  beforeEach(() => {
    cacherMock = {
      prefix: 'testPrefix',
      client: {
        hget: jest.fn(),
        hincrby: jest.fn()
      }
    };

    jest.mock('@/services/twitch-chat/normalize/EventDenormalizeMap', () => ({
      testNormalized: ['testDenormalize']
    }));

    registerCache = require('@/services/twitch-chat/RegisterCache');
  });

  it('should determine if there are listeners for a connectTarget, and nativeEventName', async () => {
    cacherMock.client.hget.mockReturnValue(3);

    // Simulate some listeners
    expect(
      registerCache.hasListener(cacherMock, { connectTarget: 'testTarget', nativeEventName: 'testNativeEventName' })
    ).resolves.toEqual(true);

    // Simulate no listeners
    cacherMock.client.hget.mockReturnValue(0);

    expect(
      registerCache.hasListener(cacherMock, { connectTarget: 'testTarget', nativeEventName: 'testNativeEventName' })
    ).resolves.toEqual(false);
  });

  it('should increment or decrement native event names based on normalized names', async () => {
    const classificationParams = { connectTarget: 'testTarget', eventClassifications: ['testNormalized'] };

    await registerCache.toggleEventTypesByClassifications(cacherMock, classificationParams, true);
    await registerCache.toggleEventTypesByClassifications(cacherMock, classificationParams, false);

    expect(cacherMock.client.hincrby).toHaveBeenCalledWith('testPrefixtwitchFilter:testTarget', 'testDenormalize', 1);
    expect(cacherMock.client.hincrby).toHaveBeenCalledWith('testPrefixtwitchFilter:testTarget', 'testDenormalize', -1);
  });
});
