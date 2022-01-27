let socketClient;

const defaultData = JSON.stringify(
  {
    platform: 'twitch',
    channelName: 'nfgCodex',
    platformEventNames: ['chat', 'join', 'part']
  },
  null,
  4
);

window.addEventListener('load', () => {
  params.value = defaultData;
});

function toggleConnection(event, connect) {
  event.preventDefault();

  if (connect) {
    connectToServer(event);
  } else {
    socketClient.disconnect();

    socketClient.off();
  }
}

function connectToServer(event) {
  if (socketClient && socketClient.connected) {
    toggleConnection(event, false);
  }

  socketClient = io({
    transports: ['websocket']
  });

  socketClient.on('connect', () => {
    addLog('Connected to API Socket');
  });

  socketClient.on('disconnect', () => {
    addLog('Disconnected from API Socket');
  });

  socketClient.on('gh-chat.evented', ({ platform, eventName, eventData }) => {
    let msgOut = '';

    switch (eventName) {
      case 'chat':
        msgOut = _buildChatHTML(eventData);
        break;

      case 'join':
      case 'part':
        msgOut = _buildJoinPartHTML(eventName, eventData);
        break;
    }

    const chatLogMsgDiv = document.createElement('div');

    chatLogMsgDiv.classList.add('chatLogMessage');
    chatLogMsgDiv.classList.add(`platform-${platform}`);
    chatLogMsgDiv.classList.add(`event-${eventName}`);
    chatLogMsgDiv.innerHTML = msgOut;

    if (addAtTop.checked) {
      chatLog.prepend(chatLogMsgDiv);
    } else {
      chatLog.append(chatLogMsgDiv);
    }
  });
}

function _buildChatHTML({ messageBuffers, userName }) {
  let msgStr = messageBuffers.reduce((str, chunk) => {
    let retStr = '';
    switch (chunk.type) {
      case 'word':
        retStr = chunk.content;
        break;
      case 'uri':
        retStr = `<a href="${chunk.content}">${chunk.content}</a>`;
        break;
      case 'emote':
        retStr = `<img src="${chunk.meta.uri}" />`;
        break;
    }

    return `${str} ${retStr}`;
  }, '');

  return `<span class="userName">${userName}</span>: ${msgStr}`;
}

function _buildJoinPartHTML(eventName, { userName }) {
  return `<span class="userName">${userName}</span> has ${eventName}ed`;
}

function sendSocketMessage(type, cmd, params) {
  return new Promise((resolve, reject) => {
    const args = 'call' === type ? ['call', cmd, params] : [cmd, params];

    args.push((err, resp) => {
      if (!err) {
        resolve(resp);
      } else {
        reject(err);
      }
    });

    socketClient.emit.apply(socketClient, args);
  });
}

async function onSubmit(event) {
  event.preventDefault();

  if (!socketClient || !socketClient.connected) {
    addLog('Not Connected yet!');
    return;
  }

  const cmd = commandName.value;
  const type = event.submitter.name;

  if (!cmd) {
    addLog('You must specify a command!\n\tTry api.');
    return;
  }

  try {
    const parsedParams = JSON.parse(params.value);

    addLog(`Sending Command (${cmd}) - ${JSON.stringify(parsedParams)}`);

    const response = await sendSocketMessage(type, cmd, parsedParams);

    addLog('Response: ' + JSON.stringify(response, null, 2));
  } catch (error) {
    addLog('ERROR:\n' + JSON.stringify(error, null, 2));
  }
}

function clearLog(event) {
  event.preventDefault();
  log.value = '';
}

function addLog(msg) {
  log.value = `${msg}\n${log.value}`;
}
