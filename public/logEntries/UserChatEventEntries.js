import { prefixTemplate } from './EntryHelper.js';

export default class UserChatEventCategoryParser {
  buildEntry({ eventClassification, connectTarget, eventData }) {
    let msgOut = '';

    const chatLogMsgDiv = document.createElement('div');

    switch (eventClassification.subCategory) {
      case 'Message':
        chatLogMsgDiv.dataset.userId = eventData.userId;
        chatLogMsgDiv.dataset.messageId = eventData.messageId;

        msgOut = this._buildChatHTML(connectTarget, eventData);
        break;

      case 'Presence':
        msgOut = this._buildJoinPartHTML(connectTarget, eventData);
        break;
    }

    chatLogMsgDiv.innerHTML = msgOut;

    return chatLogMsgDiv;
  }

  _buildChatHTML(connectTarget, { messageBuffers, userName }) {
    let msgStr = messageBuffers.reduce((str, chunk) => {
      let retStr;

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

    return `${prefixTemplate(connectTarget, userName)}: ${msgStr}`;
  }

  _buildJoinPartHTML(connectTarget, { userName, presence }) {
    return `${prefixTemplate(connectTarget, userName)} has ${presence}ed`;
  }
}
