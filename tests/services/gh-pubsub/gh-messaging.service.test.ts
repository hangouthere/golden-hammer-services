const service = require('@/services/gh-messaging.service');

//Bogus test for now, will expand when the service is built out
// Note: some of this functionality will come from existing impl in gh-pubsub
describe('Service: gh-pubsub - Service Definition', () => {
  it('should import and exist', () => {
    expect(service).not.toBeNull();
  });
});
