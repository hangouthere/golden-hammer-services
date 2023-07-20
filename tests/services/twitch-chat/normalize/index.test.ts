describe('Twitch Chat Normalize', () => {
  let clazz;

  beforeEach(() => {
    const mockNormalizerImpl = vitest.fn(() => ({
      timestamp: 'testTimeStamp',
      normalizedData: 'testNormlizedData'
    }));

    // Mock Implementations must be defined beforeEach, since we're utilizing the
    // resetMocks/resetModules options in vitest config
    vitest.mock('@/services/twitch-chat/normalize/EventNormalizeMap', () => {
      return {
        TestEvent_No_Normalizer: {
          EventClassification: 'TestEvent1.FullyClassified'
        },
        TestEvent_Normalizer: {
          EventClassification: 'TestEvent2.FullyClassified',
          Normalizer: mockNormalizerImpl
        }
      };
    });

    // Re-require our class module to get the cleaned mock impl after resetMock
    const Clazz = require('@/services/twitch-chat/normalize');

    clazz = new Clazz();
  });

  it("should throw an error if it can't map the event name", () => {
    expect(() => clazz.normalize('missingEventName', { bogus: true })).toThrowError(
      'Invalid Event Type for Processing'
    );
  });

  it("should throw an error if there isn't a Normalizer assigned", () => {
    expect(() => clazz.normalize('TestEvent_No_Normalizer', {})).toThrowError('Normalizer missing');
  });

  it('should delegate normalizing and extract sub-context', () => {
    const map = require('@/services/twitch-chat/normalize/EventNormalizeMap');

    const incomingEventArguments = {
      foo: true,
      bar: false,
      awesome: 'yes'
    };

    const retVal = clazz.normalize('TestEvent_Normalizer', incomingEventArguments);

    expect(map.TestEvent_Normalizer.Normalizer).toHaveBeenCalled();
    expect(retVal).toMatchSnapshot();
  });
});
