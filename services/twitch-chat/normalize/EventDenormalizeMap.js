/* istanbul ignore file */

const EventNormalizeMap = require('./EventNormalizeMap');

module.exports = Object.entries(EventNormalizeMap).reduce((_map, [twitchEventName, normalizeMapping]) => {
  _map[normalizeMapping.EventClassification] = _map[normalizeMapping.EventClassification] || [];

  if (!_map[normalizeMapping.EventClassification].includes(twitchEventName)) {
    _map[normalizeMapping.EventClassification].push(twitchEventName);
  }

  return _map;
}, {});
