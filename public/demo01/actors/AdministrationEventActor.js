export default class AdministrationEventActor {
  act({ eventClassification, eventData }) {
    switch (eventClassification.subCategory) {
      case 'Timeout':
      case 'Ban':
        this._markAsRemoved('user-id', eventData.targetId);
        break;
      case 'MessageRemoval':
        this._markAsRemoved('message-id', eventData.targetId);
        break;
    }
  }

  _markAsRemoved(targetType, targetId) {
    document
      .querySelectorAll(`[data-${targetType}="${targetId}"]`)
      .forEach(elm => elm.classList.add('administration-removed-content'));
  }
}
