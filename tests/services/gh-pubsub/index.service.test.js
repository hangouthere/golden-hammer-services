jest.mock('@/services/mixin-nodeRestartOnDisconnect');
jest.mock('@/services/gh-pubsub/service.meta');
jest.mock('@/services/gh-pubsub/RegisterCache');

const brokerMixin = require('../../helpers/brokerMixin');
const loggerMixin = require('../../helpers/loggerMixin');
const mixinHelper = require('../../helpers/mixinHelper');

describe('GH PubSub: Service', () => {
  let service;

  beforeEach(() => {
    jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('someFakeUUID') }));

    service = require('@/services/gh-pubsub/index.service');

    mixinHelper(service, loggerMixin);
    mixinHelper(service.methods, loggerMixin);
    mixinHelper(service.methods, brokerMixin);
  });

  describe('Helper Methods', () => {
    it('should delegate to the correct service for unregistering with the platform', async () => {
      await service.methods.unregisterWithPlatform('twitch', 'testConnectTarget', ['testEventClassification1']);

      expect(service.methods.broker.call).toHaveBeenCalled();
      expect(service.methods.broker.call.mock.calls[0][0]).toEqual('twitch-chat.unregister');
    });

    it('should delegate to the correct service for registering with the platform', async () => {
      await service.methods.registerWithPlatform('twitch', 'testConnectTarget', ['testEventClassification1']);

      expect(service.methods.broker.call).toHaveBeenCalled();
      expect(service.methods.broker.call.mock.calls[0][0]).toEqual('twitch-chat.register');
    });

    it('should delegate to the correct service for disconnecting from the platform', async () => {
      await service.methods.disconnectFromTarget('twitch', 'testConnectTarget');

      expect(service.methods.broker.call).toHaveBeenCalled();
      expect(service.methods.broker.call.mock.calls[0][0]).toEqual('twitch-chat.partChannel');
    });

    it('should delegate to the correct service for connecting to the platform', async () => {
      await service.methods.connectToTarget('twitch', 'testConnectTarget');

      expect(service.methods.broker.call).toHaveBeenCalled();
      expect(service.methods.broker.call.mock.calls[0][0]).toEqual('twitch-chat.joinChannel');
    });
  });

  describe('Events', () => {
    describe('Unregistering All Events', () => {
      it('should delegate an unregisterAll to related/internal Action by same name', async () => {
        const event = service.events['gh-pubsub.unregisterAll'];
        event.actions = { unregisterAll: jest.fn() };

        await event.handler({ params: {} });

        expect(event.actions.unregisterAll).toHaveBeenCalled();
      });
    });

    describe('Message Proxying/Eventing', () => {
      let ctx;

      beforeEach(() => {
        ctx = {
          params: {
            eventClassification: 'testEventClassification1',
            connectTarget: 'testConnectTarget',
            platform: { name: 'testPlatform' }
          }
        };

        mixinHelper(ctx, brokerMixin);
      });

      it('should not delegate any messaging into the system if no clients are expected to hear from the explicit event type', async () => {
        const { getSocketDataCacheAwaitingEventForConnectTarget } = require('@/services/gh-pubsub/RegisterCache');
        // Set up mock for empty return...
        getSocketDataCacheAwaitingEventForConnectTarget.mockReturnValue([]);

        const event = service.events['gh-messaging.evented'];
        mixinHelper(event, loggerMixin);

        await event.handler(ctx);

        expect(event.logger.debug).toHaveBeenCalled();
        expect(ctx.broker.call).not.toHaveBeenCalled();
      });

      it('should delegate messaging into the system if clients are expected to hear from the explicit event type', async () => {
        const { getSocketDataCacheAwaitingEventForConnectTarget } = require('@/services/gh-pubsub/RegisterCache');
        // Set up mock for empty return...
        getSocketDataCacheAwaitingEventForConnectTarget.mockReturnValue(['someClientId']);

        const event = service.events['gh-messaging.evented'];
        mixinHelper(event, loggerMixin);

        await event.handler(ctx);

        expect(event.logger.debug).toHaveBeenCalled();
        expect(ctx.broker.call).toHaveBeenCalled();
        expect(ctx.broker.call.mock.calls[0]).toMatchSnapshot();
      });
    });
  });

  describe('Service Actions', () => {
    let ctx;

    beforeEach(() => {
      ctx = {
        call: jest.fn(),
        params: {
          platformName: 'twitch',
          connectTarget: 'testConnectTarget',
          platformEventName: 'testPlatformEventName',
          platformEventData: 'testPlatformEventData',
          socketId: 'testSocketId',
          eventClassifications: ['testEventClassification1', 'testEventClassification2']
        },
        meta: {
          $socketId: 'testSocketId'
        }
      };

      mixinHelper(ctx, brokerMixin);
    });

    describe('Simulate', () => {
      it('should delegate a faked native event to the proper platform to simulate/propagate/etc', async () => {
        mixinHelper(service.actions.simulate, brokerMixin);

        await service.actions.simulate.handler(ctx);

        expect(service.actions.simulate.broker.emit).toHaveBeenCalled();
        expect(service.actions.simulate.broker.emit.mock.calls[0]).toMatchSnapshot();
      });
    });

    describe('Unregister All Events', () => {
      let getRegistrationsForTargetByKey;

      beforeEach(() => {
        ({ getRegistrationsForTargetByKey } = require('@/services/gh-pubsub/RegisterCache'));

        mixinHelper(service.actions.unregisterAll, loggerMixin);
      });

      it('should log errors if one occurs', async () => {
        getRegistrationsForTargetByKey.mockRejectedValueOnce(new Error('some test error'));

        await service.actions.unregisterAll.handler(ctx);

        expect(service.actions.unregisterAll.logger.error).toHaveBeenCalled();
      });

      it('should delegate a call to ourself to unregister each known registration for a connection ID (aka Socket ID)', async () => {
        getRegistrationsForTargetByKey.mockReturnValue([
          { target: 'testPlatformName-testConnectTarget' },
          { target: 'testPlatformName-testConnectTarget2' }
        ]);

        await service.actions.unregisterAll.handler(ctx);

        expect(ctx.call).toHaveBeenCalledTimes(2);
        expect(ctx.call.mock.calls[0]).toMatchSnapshot();
      });
    });

    describe('Unregister a Single Event', () => {
      let checkIfSocketRegisteredForTarget, uncacheTargetForSocket;

      beforeEach(() => {
        mixinHelper(service.actions.unregister, loggerMixin);

        ({ checkIfSocketRegisteredForTarget, uncacheTargetForSocket } = require('@/services/gh-pubsub/RegisterCache'));

        service.actions.unregister.unregisterWithPlatform = jest.fn();
        service.actions.unregister.disconnectFromTarget = jest.fn();
      });

      it('should return the error object from RegisterCache upon an error or no registered clients found', async () => {
        const errObj = {
          error: true,
          message: 'This is a fake error message from tests, but should be propagated to client'
        };

        checkIfSocketRegisteredForTarget.mockReturnValue(errObj);

        const retVal = await service.actions.unregister.handler(ctx);

        expect(retVal).toEqual(retVal);
      });

      it('should uncache the target for the Connection ID (aka Socket ID)', async () => {
        uncacheTargetForSocket.mockReturnValue({
          numConnected: 99,
          eventClassifications: ['testEventClassification1']
        });

        const retVal = await service.actions.unregister.handler(ctx);

        expect(uncacheTargetForSocket).toHaveBeenCalled();
        expect(service.actions.unregister.unregisterWithPlatform).toHaveBeenCalled();
        expect(service.actions.unregister.disconnectFromTarget).not.toHaveBeenCalled();

        expect(retVal).toMatchSnapshot();
      });

      it('should disconnect the target from the platform if there are no connections after unregistering', async () => {
        uncacheTargetForSocket.mockReturnValue({
          numConnected: 0,
          eventClassifications: ['testEventClassification1']
        });

        const retVal = await service.actions.unregister.handler(ctx);

        expect(uncacheTargetForSocket).toHaveBeenCalled();
        expect(service.actions.unregister.unregisterWithPlatform).toHaveBeenCalled();
        // Here we expect a disconnect because there are no more clients, so it's not needed: aka numConnected=0
        expect(service.actions.unregister.disconnectFromTarget).toHaveBeenCalled();

        expect(retVal).toMatchSnapshot();
      });
    });

    describe('Register a Single Event', () => {
      let cacheTargetForSocket;

      beforeEach(() => {
        mixinHelper(service.actions.register, loggerMixin);

        ({ cacheTargetForSocket } = require('@/services/gh-pubsub/RegisterCache'));
        cacheTargetForSocket.mockReturnValue(99);

        service.actions.register.registerWithPlatform = jest.fn();
        service.actions.register.connectToTarget = jest.fn();
      });

      it('should cache the target for the socket ID with the RegisterCache', async () => {
        await service.actions.register.handler(ctx);

        expect(cacheTargetForSocket).toHaveBeenCalled();
      });

      it('should emit/mark the socket as "in use" to avoid auto-disconnect', async () => {
        await service.actions.register.handler(ctx);

        expect(ctx.broker.emit).toHaveBeenCalled();
        expect(ctx.broker.emit.mock.calls[0]).toMatchSnapshot();
      });

      it('should delegate actual registration to the underlying platform service', async () => {
        await service.actions.register.handler(ctx);

        expect(service.actions.register.registerWithPlatform).toHaveBeenCalled();
        expect(service.actions.register.registerWithPlatform.mock.calls[0]).toMatchSnapshot();
      });

      it('should establish a persistent connection with the platform if no clients were previously registered', async () => {
        // Standard call, using mock above will expect 99 clients, so no connection made
        await service.actions.register.handler(ctx);
        expect(service.actions.register.connectToTarget).not.toHaveBeenCalled();

        // Mock that we're the first connection!
        cacheTargetForSocket.mockReturnValue(1);
        await service.actions.register.handler(ctx);
        expect(service.actions.register.connectToTarget).toHaveBeenCalledWith('twitch', 'testconnecttarget');
      });

      it('should gracefully error and return a PubSub Registration object indicating said error', async () => {
        service.actions.register.connectToTarget.mockRejectedValue(new Error('fake connect error'));

        // Mock that we're the first connection!
        cacheTargetForSocket.mockReturnValue(1);

        const retVal = await service.actions.register.handler(ctx);

        expect(service.actions.register.logger.error).toHaveBeenCalled();
        expect(retVal).toMatchSnapshot();
      });
    });
  });
});
