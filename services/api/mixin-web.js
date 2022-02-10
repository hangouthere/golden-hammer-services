module.exports = {
  settings: {
    // Exposed IP
    ip: '0.0.0.0',

    // Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
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

    // Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
    assets: {
      folder: 'public'
    }
  }
};
