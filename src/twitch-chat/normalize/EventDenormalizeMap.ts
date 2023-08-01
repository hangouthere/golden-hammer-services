/* istanbul ignore file */

import type { EventClassification } from 'golden-hammer-shared';
import EventNormalizeMap from './EventNormalizeMap.js';

export type EventDenormalizeMap = Record<EventClassification, string[]>;

export default Object.entries(EventNormalizeMap).reduce((_map, [twitchEventName, normalizeMapping]) => {
  _map[normalizeMapping.EventClassification] = _map[normalizeMapping.EventClassification] || [];

  if (!_map[normalizeMapping.EventClassification].includes(twitchEventName)) {
    _map[normalizeMapping.EventClassification].push(twitchEventName);
  }

  return _map;
}, {} as EventDenormalizeMap);
