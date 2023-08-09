import tmijs, { type Events as TMIjsEvents } from 'tmi.js';
import Actions from './actions.js';
import Events from './events.js';
import Methods from './methods.js';
import TMIjsEventClassificationMap from './normalize/EventNormalizeMap.js';
import NormalizerFacade from './normalize/index.js';
import type { TwitchChatServiceSchema } from './types.js';

const Service: TwitchChatServiceSchema = ({
  name: 'twitch-chat',
  mixins: [Actions, Events, Methods],

  created(this: TwitchChatServiceSchema) {
    this.logger.info(`Identifying with: '${process.env.TMIJS_USERNAME}' / '${process.env.TMIJS_PASSWORD}'`);

    const client = new tmijs.Client({
      options: { skipUpdatingEmotesets: true, messagesLogLevel: 'info' },
      connection: {
        reconnect: true,
        secure: true
      },
      identity: {
        username: process.env.TMIJS_USERNAME,
        password: process.env.TMIJS_PASSWORD
      }
    });

    this.tmijs = client;

    this.normalizer = new NormalizerFacade();
  },

  async started(this: TwitchChatServiceSchema) {
    if (!this.tmijs) {
      return;
    }

    this.tmijs.connect().catch(console.error);

    Object.keys(TMIjsEventClassificationMap).forEach(eventName => {
      this.tmijs?.on(eventName as keyof TMIjsEvents, this.eventIRCEvent.bind(this, eventName));
    });

    // Notify log that we're connected
    this.tmijs.on('connected', () => {
      this.logger.info('Connected to Twitch IRC!');
    });

    // Notify log that we're connected
    this.tmijs.on('disconnected', () => {
      this.logger.info('Lost connection to Twitch IRC!');
    });

    this.logger.info('Started TMIjs Service!');
  },

  async stopped(this: TwitchChatServiceSchema) {
    if (this.tmijs) {
      this.tmijs.disconnect();
      this.tmijs.removeAllListeners();
    }

    this.tmijs = undefined;

    this.logger.info('Stopped TMIjs Service!');
  }
});

export default Service;
