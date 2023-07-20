import IOService from './io/index.js';
import type { GHGatewayServiceSchema } from './io/types.js';
import WebService from './web/index.js';

const Service: GHGatewayServiceSchema = {
  name: 'api',
  mixins: [WebService, IOService]
} as GHGatewayServiceSchema;

export default Service;
