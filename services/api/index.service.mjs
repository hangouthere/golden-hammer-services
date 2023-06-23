import Moleculer from 'moleculer';
import molecularIo from 'moleculer-io';
import ApiGateway from 'moleculer-web';

import nodeRestartOnDisconnect from '../mixin-nodeRestartOnDisconnect.mjs';

import mixinIo from './mixin-io.mjs';
import mixinWeb from './mixin-web.mjs';

export default {
  name : 'api',
  mixins : [
    ApiGateway,
    molecularIo,
    mixinWeb,
    mixinIo,
    nodeRestartOnDisconnect
  ],

  settings: {
    // Exposed port
    port: process.env.PORT || 3000
  },

  methods: {
    /**
     * Authenticate the request. It check the `Authorization` token value in the request header.
     * Check the token value & resolve the user by the token.
     * The resolved user will be available in `ctx.meta.user`
     *
     * @param {Moleculer.Context} _ctx
     * @param {any} _route
     * @param {any} req
     */
    async authenticate(_ctx, _route, req) {
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
          //@ts-ignore
          throw new ApiGatewayService.Errors.UnAuthorizedError(Errors.ERR_INVALID_TOKEN);
        }
      } else {
        // No token. Throw an error or do nothing if anonymous access is allowed.
        // throw new E.ApiGatewayService.Errors.UnAuthorizedError(E.ERR_NO_TOKEN);
        return null;
      }
    },

    /**
     * Authorize the request. Check that the authenticated user has right to access the resource.
     *
     * @param {Moleculer.Context} ctx
     * @param {any} _route
     * @param {any} req
     */

    async authorize(ctx, _route, req) {
      // Get the authenticated user.
      const user = ctx.meta.user;

      // It check the `auth` property in action schema.
      if (req.$action.auth == 'required' && !user) {
        //@ts-ignore
        throw new ApiGatewayService.Errors.UnAuthorizedError('NO_RIGHTS');
      }
    }
  }
}
