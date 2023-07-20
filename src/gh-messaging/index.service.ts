import type { ServiceSchema, ServiceSettingSchema } from 'moleculer';

const ghMessagingService: ServiceSchema<ServiceSettingSchema> = {
  name: 'gh-messaging',

  events: {}
};

export default ghMessagingService;
