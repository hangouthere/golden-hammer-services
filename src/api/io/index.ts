import SocketIOMixin, { type IOServiceSchema } from 'moleculer-io';
import Events from './events.js';
import Methods from './methods.js';
import Settings from './settings.js';

const IOService: Partial<IOServiceSchema> = {
  mixins: [Settings, Events, Methods, SocketIOMixin]
} as IOServiceSchema;

export default IOService;
