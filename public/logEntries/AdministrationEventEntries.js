import { prefixTemplate } from './EntryHelper.js';

export default class AdministrationEventCategoryParser {
  buildEntry({ eventClassification, connectTarget, eventData }) {
    let msgOut = '';

    switch (eventClassification.subCategory) {
      case 'Ban':
        msgOut = this._buildBannedHTML(connectTarget, eventData);
        break;
      case 'Timeout':
        msgOut = this._buildTimeoutHTML(connectTarget, eventData);
        break;
      case 'MessageRemoval':
        msgOut = this._buildRemovedHTML(connectTarget, eventData);
        break;

      default:
        msgOut = 'No Parsing for ' + eventClassification.subCategory;
    }

    const eventMsgDiv = document.createElement('div');
    eventMsgDiv.innerHTML = msgOut;

    return eventMsgDiv;
  }

  _buildBannedHTML(connectTarget, { userName, targetId }) {
    return `${prefixTemplate(connectTarget, userName)} (${targetId}) was Banned`;
  }

  _buildTimeoutHTML(connectTarget, { userName, duration, targetId }) {
    return (
      `${prefixTemplate(connectTarget, userName)} (${targetId}) was Timed Out for ${duration} second` +
      (duration > 1 ? 's' : '')
    );
  }

  _buildRemovedHTML(connectTarget, { userName, targetId, removedMessage }) {
    return `
      ${prefixTemplate(connectTarget, userName)} had a message removed.

      <div class="meta">
        <div>Message ID: <span class="targetId">${targetId}</span></div>
        <div>Message: <span class="removedMessage">${removedMessage}</span></div>
      </div>
    `;
  }
}
