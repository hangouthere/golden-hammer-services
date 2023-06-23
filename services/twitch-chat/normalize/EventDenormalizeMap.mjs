/* istanbul ignore file */

import EventNormalizeMap from './EventNormalizeMap.mjs';

export default Object.entries(EventNormalizeMap).reduce((_map, [twitchEventName, normalizeMapping]) => {
  _map[normalizeMapping.EventClassification] = _map[normalizeMapping.EventClassification] || [];

  if (!_map[normalizeMapping.EventClassification].includes(twitchEventName)) {
    _map[normalizeMapping.EventClassification].push(twitchEventName);
  }

  return _map;
}, {});
