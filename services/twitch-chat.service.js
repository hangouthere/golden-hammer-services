const tmijs = require('tmi.js');
const { NormalizeMessageTwitch } = require('../src/NormalizeMessageTwitch');

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

    this.normalizer = new NormalizeMessageTwitch();
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
      // rest: 'POST /joinChannel',
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
      // rest: 'POST /partChannel',
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
    },

    normalize: {
      params: {
        platformEventName: 'string',
        platformEventData: 'any'
      },
      handler(ctx) {
        const { platformEventName, platformEventData } = ctx.params;

        return this.normalizer.normalize(platformEventName, platformEventData);
      }
    }
  },

  methods: {
    delegateIRCEvent(eventName, channel, ...rest) {
      let proxyEventData, userName, userState, message, isSelf;

      switch (eventName) {
        case 'join':
        case 'part':
          [userName, isSelf] = rest;
          if (isSelf) return;

          proxyEventData = { userName };
          break;
        case 'chat':
          [userState, message, isSelf] = rest;
          proxyEventData = { userState, message, isSelf };
          break;

        default:
          this.logger.info(`No mapping: (${eventName}) ${channel} ->`, rest);

          break;
      }

      if (proxyEventData) {
        this.broker.emit('twitch-chat.evented', {
          platformEventName: eventName,
          platformEventData: proxyEventData
        });
      }
    }
  }
};
