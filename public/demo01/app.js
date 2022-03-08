import AdministrationEventActor from './actors/AdministrationEventActor.js';
import MonetizationEventActor from './actors/MonetizationEventActor.js';
import AdministrationEventEntries from './logEntries/AdministrationEventEntries.js';
import MonetizationEventEntries from './logEntries/MonetizationEventEntries.js';
import UserChatEventEntries from './logEntries/UserChatEventEntries.js';

const DEFAULT_DATA = JSON.stringify(
  {
    platformName: 'twitch',
    connectTarget: 'nfgcodex',
    eventCategories: ['UserChat', 'Monetization', 'Administration', 'PlatformSpecific']
  },
  null,
  4
);

const EventControllers = {
  Administration: {
    LogEntry: new AdministrationEventEntries(),
    Actor: new AdministrationEventActor()
  },

  Monetization: {
    LogEntry: new MonetizationEventEntries(),
    Actor: new MonetizationEventActor()
  },

  UserChat: {
    LogEntry: new UserChatEventEntries(),
    Actor: null
  }
};

export default class App {
  socketClient;

  socketParams = /** @type {HTMLTextAreaElement} */ (document.getElementById('socketParams'));
  commandName = /** @type {HTMLInputElement} */ (document.getElementById('commandName'));
  addAtTop = /** @type {HTMLInputElement} */ (document.getElementById('addAtTop'));
  scrollWithEventLog = /** @type {HTMLInputElement} */ (document.getElementById('scrollWithEventLog'));
  socketLog = /** @type {HTMLTextAreaElement} */ (document.getElementById('socketLog'));
  eventLog = /** @type {HTMLElement} */ (document.getElementById('eventLog'));
  totalEstimatedValued = /** @type {HTMLElement} */ (document.getElementById('totalEstimatedValued'));

  get isConnected() {
    return this.socketClient && this.socketClient.connected;
  }

  constructor() {
    // Set default data
    this.socketParams.value = DEFAULT_DATA;
    this.totalEstimatedValued.innerText = (0).toFixed(2);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  toggleConnection(event, connect) {
    event.preventDefault();

    if (connect) {
      this._connectToServer(event);
    } else if (this.socketClient) {
      this.socketClient.disconnect();
      this.socketClient.off();
    }
  }

  async onSubmit(event) {
    event.preventDefault();

    if (!this.isConnected) {
      this._addLog('Not Connected yet!');
      return;
    }

    const cmd = this.commandName.value;
    const type = event.submitter.name;

    if (!cmd) {
      this._addLog('You must specify a command!\n\tTry api.');
      return;
    }

    try {
      const parsedParams = JSON.parse(this.socketParams.value);

      this._addLog(`Sending Command (${cmd}) - ${JSON.stringify(parsedParams)}\n`);

      const response = await this._sendSocketMessage(type, cmd, parsedParams);

      this._addLog('Response: ' + JSON.stringify(response, null, 2));
    } catch (error) {
      this._addLog('ERROR:\n' + JSON.stringify(error, null, 2));
    }
  }

  clearLog(event) {
    event.preventDefault();
    this.socketLog.value = '';
  }

  clearEvents() {
    this.eventLog.innerText = '';
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  _onConnect = () => {
    this._addLog('Connected to API Socket');
  };

  _onDisconnect = () => {
    this._addLog('Disconnected from API Socket');
  };

  /**
   * @param { import('golden-hammer-shared').NormalizedMessagingEvent } normalizedEvent
   */
  _onPubSubMessaging = normalizedEvent => {
    const chosenEventControllers = this._getControllersForEventCategory(normalizedEvent.eventClassification.category);

    this._generateAndInsertEventLogEntry(chosenEventControllers.LogEntry, normalizedEvent);
    this._actionOnEventClassification(chosenEventControllers.Actor, normalizedEvent);
  };

  _connectToServer(event) {
    // If already connected, disconnect FIRST
    if (this.isConnected) {
      this.toggleConnection(event, false);
    }

    this.socketClient = globalThis.io({
      transports: ['websocket']
    });

    this.socketClient.on('connect', this._onConnect);
    this.socketClient.on('disconnect', this._onDisconnect);
    this.socketClient.on('gh-chat.evented', this._onPubSubMessaging);
  }

  _sendSocketMessage(type, cmd, params) {
    return new Promise((resolve, reject) => {
      // Build args to "apply" to socket.emit
      // If we want to "call", we use it as the event, otherwise the command is the event
      const args = 'call' === type ? ['call', cmd, params] : [cmd, params];

      args.push((err, resp) => {
        if (!err) {
          resolve(resp);
        } else {
          reject(err);
        }
      });

      this.socketClient.emit.apply(this.socketClient, args);
    });
  }

  _addLog(msg) {
    this.socketLog.value = `${msg}\n${this.socketLog.value}`;
  }

  _getControllersForEventCategory(eventCategory) {
    const chosenEventControllers = EventControllers[eventCategory];

    if (!chosenEventControllers) {
      return this._addLog(`Error: ${eventCategory} is not a supported EventCategory in this client!`);
    }

    return chosenEventControllers;
  }

  _generateAndInsertEventLogEntry(LogEntry, { eventClassification, platform, connectTarget, eventData }) {
    const insertEventLogDiv = LogEntry.buildEntry({
      platform,
      eventClassification,
      connectTarget,
      eventData
    });

    // Assign general classes for styling and selecting via CSS and Actors respectively
    insertEventLogDiv.classList.add(`eventlog-entry`);
    insertEventLogDiv.classList.add(`eventCategory-${eventClassification.category}`);
    insertEventLogDiv.classList.add(`eventSubCategory-${eventClassification.subCategory}`);
    insertEventLogDiv.classList.add(`platform-${platform.name}`);
    insertEventLogDiv.classList.add(`platform-event-${platform.eventName}`);

    this.eventLog.append(insertEventLogDiv);

    this._manageEventLogScroll();
  }

  _actionOnEventClassification(Actor, { eventClassification, platform, connectTarget, eventData }) {
    if (!Actor) {
      return;
    }

    Actor.act({
      platform,
      eventClassification,
      connectTarget,
      eventData,
      elems: this
    });
  }

  _manageEventLogScroll() {
    // Add at top or bottom based on settings, and scrollock if enabled
    this.eventLog.style.flexDirection = this.addAtTop.checked ? 'column-reverse' : 'column';

    // Scroll Event Log if necessary
    if (this.scrollWithEventLog.checked) {
      // Because of how we're using flex-display, we always set the scrollTop to the scrollHeight,
      // However, based on reverse or not, we want to invert the height value
      this.eventLog.scrollTop = this.eventLog.scrollHeight * (this.addAtTop.checked ? -1 : 1);
    }
  }
}
