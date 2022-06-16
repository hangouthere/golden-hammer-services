jest.mock('@/services/twitch-chat/normalize');
jest.mock('@/services/twitch-chat/normalize/EventNormalizeMap', () => ({
  testNativeEventName: true
}));
jest.mock('@/services/twitch-chat/service.meta');
jest.mock('@/services/twitch-chat/RegisterCache');

const brokerMixin = require('../../helpers/brokerMixin');
const loggerMixin = require('../../helpers/loggerMixin');
const mixinHelper = require('../../helpers/mixinHelper');

describe('Twitch Chat: Service', () => {
  let tmijs, tmiClient, service;

  beforeEach(() => {
    jest.mock('tmi.js');

    tmijs = require('tmi.js');
    tmiClient = new tmijs.Client();

    service = require('@/services/twitch-chat/index.service');

    mixinHelper(service, loggerMixin);
    mixinHelper(service.methods, loggerMixin);
    mixinHelper(service.methods, brokerMixin);
  });

  describe('Helper Methods', () => {
    it('should break early if there are no listeners expecting to hear from a native event', () => {
      const { hasListener } = require('@/services/twitch-chat/RegisterCache');

      hasListener.mockReturnValue(false);

      expect(service.methods.eventIRCEvent('nativeEventName', 'channel', '')).resolves.toBeUndefined();
    });

    it('should normalize and emit into the system', async () => {
      const { hasListener } = require('@/services/twitch-chat/RegisterCache');

      hasListener.mockReturnValue(true);

      service.methods.normalizer = {
        normalize: jest.fn().mockReturnValue({
          timestamp: 'now',
          eventClassification: 'testEventClassification',
          normalizedData: { lotsOfData: true }
        })
      };

      await service.methods.eventIRCEvent('nativeEventName', 'channel', '');

      expect(service.methods.normalizer.normalize).toHaveBeenCalled();
      expect(service.methods.broker.emit).toHaveBeenCalled();

      expect(service.methods.broker.emit.mock.calls[0][1]).toMatchSnapshot();
    });
  });

  describe('Events', () => {
    it('should delegate the simulated event to our helper method', async () => {
      service.events['twitch-chat.simulate'].eventIRCEvent = jest.fn();

      await service.events['twitch-chat.simulate'].handler({
        params: {
          connectTarget: 'testConnectTarget',
          platformEventName: 'testPlatformEventName',
          platformEventData: ['testPlatformEventData']
        }
      });

      expect(service.events['twitch-chat.simulate'].eventIRCEvent).toHaveBeenCalledWith(
        'testPlatformEventName',
        '#testConnectTarget',
        'testPlatformEventData'
      );
    });
  });

  describe('Actions', () => {
    it('should delegate to RegisterCache when trying to unregister', async () => {
      const { toggleEventTypesByClassifications } = require('@/services/twitch-chat/RegisterCache');

      await service.actions.unregister.handler({ ...brokerMixin });

      expect(toggleEventTypesByClassifications).toHaveBeenCalled();
    });

    it('should delegate to RegisterCache when trying to register', async () => {
      const { toggleEventTypesByClassifications } = require('@/services/twitch-chat/RegisterCache');

      await service.actions.register.handler({ ...brokerMixin });

      expect(toggleEventTypesByClassifications).toHaveBeenCalled();
    });

    it('should delegate to TMIjs when trying to part from a channel', async () => {
      mixinHelper(service.actions.partChannel, loggerMixin);

      service.actions.partChannel.tmijs = tmiClient;

      await service.actions.partChannel.handler({ params: { connectTarget: 'testConnectTarget' } });

      expect(tmiClient.part).toHaveBeenCalled();
    });

    it('should gracefully error when trying to delegate to TMIjs when trying to part from a channel', async () => {
      mixinHelper(service.actions.partChannel, loggerMixin);

      service.actions.partChannel.tmijs = tmiClient;

      tmiClient.part = undefined;

      await service.actions.partChannel.handler({ params: { connectTarget: 'testConnectTarget' } });

      expect(service.actions.partChannel.logger.error).toHaveBeenCalled();
    });

    it('should delegate to TMIjs when trying to join from a channel', async () => {
      mixinHelper(service.actions.joinChannel, loggerMixin);

      service.actions.joinChannel.tmijs = tmiClient;

      await service.actions.joinChannel.handler({ params: { connectTarget: 'testConnectTarget' } });

      expect(tmiClient.join).toHaveBeenCalled();
    });

    it('should gracefully error when trying to delegate to TMIjs when trying to join from a channel', async () => {
      mixinHelper(service.actions.joinChannel, loggerMixin);

      service.actions.joinChannel.tmijs = tmiClient;

      tmiClient.join = undefined;

      await service.actions.joinChannel.handler({ params: { connectTarget: 'testConnectTarget' } });

      expect(service.actions.joinChannel.logger.error).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    let tmiMock;
    beforeEach(() => {
      tmiMock = {
        disconnect: jest.fn(),
        removeAllListeners: jest.fn(),
        on: jest.fn((_eventName, cb) => cb()),
        connect: jest.fn().mockResolvedValue(true)
      };

      service.tmijs = tmiMock;
      service.eventIRCEvent = jest.fn();
    });

    it('should clean up the TMIjs instance when stopped', async () => {
      await service.stopped();

      expect(tmiMock.disconnect).toHaveBeenCalled();
      expect(tmiMock.removeAllListeners).toHaveBeenCalled();
      expect(service.tmijs).toBeNull();
    });

    it('should use TMIjs to connect to Twitch when started', async () => {
      await service.started();

      expect(tmiMock.connect).toHaveBeenCalled();
    });

    it('should register for expected native events, as well as internal-tracked events', async () => {
      await service.started();

      // Tracked via "config"
      expect(tmiMock.on.mock.calls[0][0]).toBe('testNativeEventName');
      // Tracked internally for lifecycle efforts
      expect(tmiMock.on.mock.calls[1][0]).toBe('connected');
      expect(tmiMock.on.mock.calls[2][0]).toBe('disconnected');
    });

    it('should create a new TMIjs client when the service is created', async () => {
      const Normalizer = require('@/services/twitch-chat/normalize');

      await service.created();

      expect(tmijs.Client).toHaveBeenCalled();
      expect(Normalizer).toHaveBeenCalled();
      expect(service.tmijs).not.toBeUndefined();
      expect(service.normalizer).not.toBeUndefined();
    });
  });
});
