const Clazz = require('@/services/twitch-chat/normalize');

jest.mock('@/services/twitch-chat/normalize/EventNormalizeMap', () => ({
  TestEvent_No_Normalizer: {
    EventClassification: 'TestEvent1.FullyClassified'
  },
  TestEvent_Normalizer: {
    EventClassification: 'TestEvent2.FullyClassified',
    Normalizer: jest.fn(() => ({
      timestamp: 'testTimeStampe',
      normalizedData: 'testNormlizedData'
    }))
  }
}));

describe('Twitch Chat Normalize', () => {
  let clazz;

  beforeEach(() => {
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
