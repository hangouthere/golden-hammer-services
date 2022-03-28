jest.mock('uuid');
jest.useFakeTimers();

const mixin = require('@/services/api/mixin-io');
const brokerMixin = require('../../helpers/brokerMixin');
const loggerMixin = require('../../helpers/loggerMixin');
const mixinHelper = require('../../helpers/mixinHelper');

const SOCKET_ID = 'fakeRandomSocketId';

describe('Service: API Gateway - Mixin: IO', () => {
  let socket, next, rootNS;

  // Clone the mixin for each test
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    jest.clearAllTimers();

    rootNS = mixin.settings.io.namespaces['/'];

    next = jest.fn();

    socket = {
      id: SOCKET_ID,
      disconnect: jest.fn()
    };
  });

  describe('Methods', () => {
    describe('Socket Auto Timeout Feature', () => {
      let prevdisconnectSocket;
      beforeEach(() => {
        prevdisconnectSocket = mixin.methods.disconnectSocket;
        mixin.methods.disconnectSocket = jest.fn();
      });

      afterEach(() => {
        mixin.methods.disconnectSocket.mockRestore();
        mixin.methods.disconnectSocket = prevdisconnectSocket;
      });

      it('Should register auto timeout', () => {
        mixin.methods.SocketAutoTimeoutMiddleware(socket, next);

        expect(next).toBeCalled();
        expect(mixin.methods.disconnectSocket).not.toBeCalled();
      });

      it('Should trigger auto timeout if not used', () => {
        mixin.methods.SocketAutoTimeoutMiddleware(socket, next);

        expect(next).toBeCalled();
        expect(mixin.methods.disconnectSocket).not.toBeCalled();

        jest.runAllTimers();

        expect(mixin.methods.disconnectSocket).toBeCalled();
      });
    });

    describe('Socket Disconnect Detection', () => {
      beforeEach(() => {
        mixinHelper(mixin.methods, loggerMixin);
        mixinHelper(mixin.methods, brokerMixin);
      });

      it('should disconnect the socket', () => {
        mixin.methods.disconnectSocket(socket);

        expect(socket.disconnect).toBeCalled();
      });

      it('should broadcast to the socket api for the associated socket ID', () => {
        mixin.methods.disconnectSocket(socket);

        expect(mixin.methods.broker.call).toBeCalled();
        expect(mixin.methods.broker.call.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('Events', () => {
    describe('Socket used within System', () => {
      let oldFn;
      beforeEach(() => {
        // Fix up the data internally to test clearing properly
        oldFn = mixin.methods.disconnectSocket;
        mixin.methods.disconnectSocket = jest.fn();

        mixin.methods.SocketAutoTimeoutMiddleware(socket, next);
      });
      afterEach(() => {
        mixin.methods.disconnectSocket = oldFn;
      });

      it('should clear the timeout when used', () => {
        const ctx = { params: { socketId: SOCKET_ID } };
        mixin.events['api.socket-used'].handler(ctx);

        jest.runAllTimers();

        expect(mixin.methods.disconnectSocket).not.toBeCalled();
      });

      it('should allow force disconnecting if not used', () => {
        jest.runAllTimers();

        expect(mixin.methods.disconnectSocket).toBeCalled();
      });
    });
  });

  describe('"Mixin Actions"', () => {
    test('Junk Test for Coverage', () => {
      const orig = rootNS.middlewares.SocketAutoTimeoutMiddleware;
      rootNS.middlewares.SocketAutoTimeoutMiddleware = jest.fn();
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
      const getActionList = jest
        .fn()
        .mockReturnValue([{ name: 'gh-pubsub.fakeMethod', action: { params: { foo: true } } }]);

      const cb = jest.fn();
      rootNS.events.$service.broker.registry = { getActionList };
      rootNS.events.listHandlers(null, cb);

      expect(cb).toHaveBeenCalledWith(null, [{ name: 'gh-pubsub.fakeMethod', params: { foo: true } }]);
    });
  });
});
