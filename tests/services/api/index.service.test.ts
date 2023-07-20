vitest.mock('moleculer-web');
vitest.mock('moleculer-io');
vitest.mock('@/services/api/mixin-web');
vitest.mock('@/services/api/mixin-io');
vitest.mock('@/services/mixin-nodeRestartOnDisconnect');

describe.skip('Service: API Gateway', () => {
  describe('authenticate', () => {
    it("should currently be skipped, because this isn't our code", () => {
      expect(true).toBe(true);
    });
  });
});
