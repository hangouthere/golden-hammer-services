let total = 0;

export default class MonetizationEventActor {
  act({ platform, eventClassification, eventData, elems }) {
    switch (eventClassification.subCategory) {
      case 'Subscription':
      case 'Tip':
        let msgType = platform.eventData[2]?.['message-type'];
        msgType = msgType ? msgType : platform.eventData[3]?.['message-type'];

        const isGiftingMsg = 'submysterygift' === msgType;

        if (isGiftingMsg) {
          return;
        }

        // Update the running total in memory, and update UI
        total += eventData.estimatedValue;
        elems.totalEstimatedValued.innerText = total.toFixed(2);

        break;
    }
  }
}
