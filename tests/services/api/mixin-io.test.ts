vitest.mock('uuid');
vitest.useFakeTimers();

import mixin, { events, methods, settings } from '-/api/mixin-io';
import brokerMixin from '../../helpers/brokerMixin.js';
import loggerMixin from '../../helpers/loggerMixin.js';
import mixinHelper from '../../helpers/mixinHelper.js';

const SOCKET_ID = 'fakeRandomSocketId';

describe('Service: API Gateway - Mixin: IO', () => {
  let socket, next, rootNS;

  // Clone the mixin for each test
  beforeEach(() => {
    vitest.clearAllTimers();

    rootNS = settings.io.namespaces['/'];

    next = vitest.fn();

    socket = {
      id: SOCKET_ID,
      disconnect: vitest.fn()
    };
  });

  describe('Methods', () => {
    describe('Socket Auto Timeout Feature', () => {
      let prevdisconnectSocket;
      beforeEach(() => {
        prevdisconnectSocket = methods.disconnectSocket;
        methods.disconnectSocket = vitest.fn();
      });

      afterEach(() => {
        methods.disconnectSocket.mockRestore();
        methods.disconnectSocket = prevdisconnectSocket;
      });

      it('Should register auto timeout', () => {
        methods.SocketAutoTimeoutMiddleware(socket, next);

        expect(next).toBeCalled();
        expect(methods.disconnectSocket).not.toBeCalled();
      });

      it('Should trigger auto timeout if not used', () => {
        methods.SocketAutoTimeoutMiddleware(socket, next);

        expect(next).toBeCalled();
        expect(methods.disconnectSocket).not.toBeCalled();

        vitest.runAllTimers();

        expect(methods.disconnectSocket).toBeCalled();
      });
    });

    describe('Socket Disconnect Detection', () => {
      beforeEach(() => {
        mixinHelper(methods, loggerMixin);
        mixinHelper(methods, brokerMixin);
      });

      it('should disconnect the socket', () => {
        methods.disconnectSocket(socket);

        expect(socket.disconnect).toBeCalled();
      });

      it('should broadcast to the socket api for the associated socket ID', () => {
        methods.disconnectSocket(socket);

        expect(methods.broker.call).toBeCalled();
        expect(methods.broker.call.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('Events', () => {
    describe('Socket used within System', () => {
      let oldFn;
      beforeEach(() => {
        // Fix up the data internally to test clearing properly
        oldFn = methods.disconnectSocket;
        methods.disconnectSocket = vitest.fn();

        methods.SocketAutoTimeoutMiddleware(socket, next);
      });
      afterEach(() => {
        methods.disconnectSocket = oldFn;
      });

      it('should clear the timeout when used', () => {
        const ctx = { params: { socketId: SOCKET_ID } };
        events['api.socket-used'].handler(ctx);

        vitest.runAllTimers();

        expect(methods.disconnectSocket).not.toBeCalled();
      });

      it('should allow force disconnecting if not used', () => {
        vitest.runAllTimers();

        expect(methods.disconnectSocket).toBeCalled();
      });
    });
  });

  describe('"Mixin Actions"', () => {
    test('Junk Test for Coverage', () => {
      const orig = rootNS.middlewares.SocketAutoTimeoutMiddleware;
      rootNS.middlewares.SocketAutoTimeoutMiddleware = vitest.fn();
      rootNS.middlewares[0]();
      rootNS.middlewares.SocketAutoTimeoutMiddleware = orig;
    });

    it('should delegate unregistering for the socket', () => {
      rootNS.events = { ...rootNS.events, id: SOCKET_ID, $service: {} };
      mixinHelper(rootNS.events.$service, loggerMixin);
      mixinHelper(rootNS.events.$service, brokerMixin);

      rootNS.events.disconnect();

      expect(rootNS.events.$service.broker.emit).toHaveBeenCalledWith('gh-pubsub.unregisterAll', {
        socketId: SOCKET_ID
      });
    });

    it('should list handlers allowed from within the system', () => {
      rootNS.events.$service = mixin;
      mixinHelper(rootNS.events.$service, brokerMixin);
      const getActionList = vitest
        .fn()
        .mockReturnValue([{ name: 'gh-pubsub.fakeMethod', action: { params: { foo: true } } }]);

      const cb = vitest.fn();
      rootNS.events.$service.broker.registry = { getActionList };
      rootNS.events.listHandlers(null, cb);

      expect(cb).toHaveBeenCalledWith(null, [{ name: 'gh-pubsub.fakeMethod', params: { foo: true } }]);
    });
  });
});
