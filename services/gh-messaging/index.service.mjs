import nodeRestartOnDisconnect from '../mixin-nodeRestartOnDisconnect.mjs';

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
export default {
  name: 'gh-messaging',

  mixins: [nodeRestartOnDisconnect],

  events: {}
};
