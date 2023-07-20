import type { ServiceSchema } from 'moleculer';
import type { ApiSettingsSchema } from 'moleculer-web';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ASSET_PATH = resolve(__dirname, '..', 'public');

const Settings: Partial<ServiceSchema<ApiSettingsSchema>> = {
  settings: {
    ip: '0.0.0.0',

    cors: {
      origin: '*'
    },

    use: [],

    routes: [
      {
        path: '/api',

        whitelist: ['**'],
        authentication: false,
        authorization: false,
        autoAliases: true,

        bodyParsers: {
          json: {
            strict: false,
            limit: '1MB'
          },
          urlencoded: {
            extended: true,
            limit: '1MB'
          }
        },

        mappingPolicy: 'restrict',

        logging: true
      }
    ],

    log4XXResponses: false,
    logRequestParams: null,
    logResponseData: null,

    assets: {
      folder: ASSET_PATH
    }
  }
};

export default Settings;
