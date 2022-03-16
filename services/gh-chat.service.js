/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'gh-messaging',

  mixins: [require('./mixin-nodeRestartOnDisconnect')],

  events: {}
};
