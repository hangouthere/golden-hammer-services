/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'gh-chat',

  mixins: [require('./mixin-nodeRestartOnDisconnect')],

  events: {}
};
