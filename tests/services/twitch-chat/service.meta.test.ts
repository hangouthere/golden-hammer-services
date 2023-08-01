const meta = require('-/twitch-chat/service.meta');

describe('Twitch Chat: Service Meta', () => {
  it('should import and exist', () => {
    expect(meta).not.toBeNull();
  });
});
