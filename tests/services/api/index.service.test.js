jest.mock('moleculer-web');
jest.mock('moleculer-io');
jest.mock('@/services/api/mixin-web');
jest.mock('@/services/api/mixin-io');
jest.mock('@/services/mixin-nodeRestartOnDisconnect');

describe.skip('Service: API Gateway', () => {
  describe('authenticate', () => {
    it("should currently be skipped, because this isn't our code", () => {
      expect(true).toBe(true);
    });
  });
});
