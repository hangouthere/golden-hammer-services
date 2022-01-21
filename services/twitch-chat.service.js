const tmijs = require('tmi.js');

const IRC_EVENTS = [
  'action',
  'anongiftpaidupgrade',
  'ban',
  'chat',
  'cheer',
  'clearchat',
  // 'connected',
  'connecting',
  'disconnected',
  'emoteonly',
  'emotesets',
  'followersonly',
  'giftpaidupgrade',
  'hosted',
  'hosting',
  'join',
  // 'logon',
  // 'message',
  'messagedeleted',
  'mod',
  'mods',
  'notice',
  'part',
  // 'ping',
  // 'pong',
  'r9kbeta',
  'raided',
  // 'raw_message',
  'reconnect',
  'resub',
  // 'roomstate',
  'serverchange',
  'slowmode',
  'subgift',
  'submysterygift',
  'subscribers',
  'subscription',
  'timeout',
  'unhost',
  'unmod',
  'vips',
  'whisper'
];

module.exports = {
  name: 'twitch-chat',

  created() {
    const client = new tmijs.Client({
      options: { messagesLogLevel: 'info' },
      connection: {
        reconnect: true,
        secure: true
      },
      identity: {
        username: process.env.TMIJS_USERNAME
        // password: process.env.TMIJS_PASSWORD
      }
    });

    this.tmijs = client;
  },

  async started() {
    this.tmijs.connect().catch(console.error);

    IRC_EVENTS.forEach(eventName => {
      this.tmijs.on(eventName, this.delegateIRCEvent.bind(this, eventName));
    });

    this.logger.info('Started TMIjs Service!');
  },

  async stopped() {
    this.tmijs.disconnect();
    this.tmijs.removeAllListeners();
    this.tmijs = null;

    this.logger.info('Stopped TMIjs Service!');
  },

  actions: {
    joinChannel: {
      rest: 'POST /joinChannel',
      params: {
        channelName: 'string'
      },
      async handler(ctx) {
        const { channelName } = ctx.params;

        try {
          await this.tmijs.join(channelName);
          this.logger.info(`Joined Channel: ${channelName}`);
        } catch (err) {
          this.logger.error(err);
          throw err;
        }

        return {
          joined: true,
          channelName
        };
      }
    },

    partChannel: {
      rest: 'POST /partChannel',
      params: {
        channelName: 'string'
      },
      async handler(ctx) {
        const { channelName } = ctx.params;

        try {
          await this.tmijs.part(channelName);
          this.logger.info(`Parted Channel: ${channelName}`);
        } catch (err) {
          this.logger.error(err);
          throw err;
        }

        return {
          parted: true,
          channelName
        };
      }
    }
  },

  methods: {
    isConnected: () => 'OPEN' === this.tmijs.readyState(),

    delegateIRCEvent(eventName, channel, ...rest) {
      let userName, userState, message, isSelf;

      switch (eventName) {
        case 'join':
        case 'part':
          [userName, isSelf] = rest;
          if (isSelf) break;
          this.logger.info(`${userName} ${eventName}ed`);
          break;
        case 'chat':
          [userState, message, self] = rest;
          this.logger.info(`${userState['display-name']} -> ${message}`);
          break;

        default:
          this.logger.info(`No mapping: (${eventName}) ${channel} ->`, rest);

          break;
      }
    }
  }
};
