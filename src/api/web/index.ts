import type { ServiceSchema } from 'moleculer';
import type { ApiSettingsSchema } from 'moleculer-web';
import ApiGatewayService from 'moleculer-web';
import Settings from './settings.js';

const WebService: Partial<ServiceSchema<ApiSettingsSchema>> = {
  mixins: [Settings, ApiGatewayService]
};

export default WebService;
