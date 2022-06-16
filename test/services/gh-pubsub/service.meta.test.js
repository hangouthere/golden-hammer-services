const meta = require('@/services/gh-pubsub/service.meta');

describe('Service: gh-pubsub - Service Meta', () => {
  it('should import and exist', () => {
    expect(meta).not.toBeNull();
  });
});
