'use strict';

const ApiGateway = require('moleculer-web');
const SocketGateway = require('moleculer-io');
const configWeb = require('./config-web');
const configIo = require('./config-io');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */

module.exports = {
  name: 'api',
  mixins: [ApiGateway, SocketGateway],

  // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
  settings: {
    // Exposed port
    port: process.env.PORT || 3000,
    ...configWeb,
    ...configIo
  },

  methods: {
    /**
     * Authenticate the request. It check the `Authorization` token value in the request header.
     * Check the token value & resolve the user by the token.
     * The resolved user will be available in `ctx.meta.user`
     *
     * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
     *
     * @param {Context} ctx
     * @param {Object} route
     * @param {IncomingRequest} req
     * @returns {Promise}
     */
    async authenticate(ctx, route, req) {
      // Read the token from header
      const auth = req.headers['authorization'];

      if (auth && auth.startsWith('Bearer')) {
        const token = auth.slice(7);

        // Check the token. Tip: call a service which verify the token. E.g. `accounts.resolveToken`
        if (token == '123456') {
          // Returns the resolved user. It will be set to the `ctx.meta.user`
          return { id: 1, name: 'John Doe' };
        } else {
          // Invalid token
          throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN);
        }
      } else {
        // No token. Throw an error or do nothing if anonymous access is allowed.
        // throw new E.UnAuthorizedError(E.ERR_NO_TOKEN);
        return null;
      }
    },

    /**
     * Authorize the request. Check that the authenticated user has right to access the resource.
     *
     * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
     *
     * @param {Context} ctx
     * @param {Object} route
     * @param {IncomingRequest} req
     * @returns {Promise}
     */
    async authorize(ctx, route, req) {
      // Get the authenticated user.
      const user = ctx.meta.user;

      // It check the `auth` property in action schema.
      if (req.$action.auth == 'required' && !user) {
        throw new ApiGateway.Errors.UnAuthorizedError('NO_RIGHTS');
      }
    }
  }
};
