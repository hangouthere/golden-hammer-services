const mixin = require('@/services/api/mixin-web');

describe('Service: API Gateway - Mixin: Web', () => {
  it('should import without error', () => {
    expect(mixin).not.toBeNull();
  });
});
