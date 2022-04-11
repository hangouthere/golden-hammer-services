const mixin = require('@/services/mixin-nodeRestartOnDisconnect');

describe('Mixin: nodeRestartOnDisconnect', () => {
  let eventDisconnect, procSpy;

  beforeEach(() => {
    eventDisconnect = mixin.events['$node.disconnected'];

    procSpy = jest.spyOn(process, 'exit');
    procSpy.mockReturnValue(0);
  });

  it('should noop if the service disconnect isn\'t the "local" service (aka self)', () => {
    eventDisconnect({
      params: {
        node: { local: false }
      }
    });

    expect(procSpy).not.toBeCalled();
  });

  it('should force exit the service if the disconnect is the "local" service (aka self)', () => {
    eventDisconnect({
      params: {
        node: { local: true }
      }
    });

    expect(procSpy).toBeCalled();
  });
});
