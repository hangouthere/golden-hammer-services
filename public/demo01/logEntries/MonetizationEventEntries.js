import { prefixTemplate } from './EntryHelper.js';

export default class MonetizationEventCategoryParser {
  buildEntry({ eventClassification, connectTarget, eventData, platform }) {
    let msgOut = '';

    const chatLogMsgDiv = document.createElement('div');

    switch (eventClassification.subCategory) {
      case 'Subscription':
        msgOut = this._buildSubscriptionHTML(connectTarget, platform, eventData);
        break;

      case 'Tip':
        msgOut = this._buildTipHTML(connectTarget, eventData);
        break;
    }

    chatLogMsgDiv.innerHTML = msgOut;

    return chatLogMsgDiv;
  }

  _amt = ev => ev.toFixed(2);

  _buildSubscriptionHTML(connectTarget, platform, { sourceUserName, duration, estimatedValue }) {
    let msgType = platform.eventData[2]?.['message-type'];
    msgType = msgType ? msgType : platform.eventData[3]?.['message-type'];

    const isGiftingMsg = 'submysterygift' === msgType;
    const isGiftedMsg = 'subgift' === msgType;
    const isResub = 'resub' === msgType;

    let giftedMsg = !isGiftingMsg ? '' : ' [Gifting]';
    giftedMsg = !isGiftedMsg ? giftedMsg : ' [Gifted]';

    const subType = isResub ? 'Resubscribed' : 'Subscribed';

    return `${prefixTemplate(connectTarget, sourceUserName)}: ${subType}${giftedMsg} (${duration}) - $${this._amt(
      estimatedValue
    )}`;
  }

  _buildTipHTML(connectTarget, { sourceUserName, estimatedValue }) {
    return `${prefixTemplate(connectTarget, sourceUserName)}: Tipped - $${this._amt(estimatedValue)}`;
  }
}
