/**
 * @typedef {Object} TargetClassificationCache
 * @property {string} target
 * @property {string[]} eventClassifications
 */

const EventDenormalizeMap = require('./normalize/EventDenormalizeMap');

const KEY_PREFIX = 'twitchFilter';

/**
 * @param {import('moleculer').Cachers.Redis<import('ioredis').Redis>} cacher
 * @param {object} options
 * @param {string} options.connectTarget
 * @param {string[]} options.eventClassifications
 * @returns {Promise<any>}
 */
const toggleEventTypesByClassifications = async (cacher, { connectTarget, eventClassifications }, adding = true) => {
  const key = `${cacher.prefix}${KEY_PREFIX}:${connectTarget}`;

  let nativeEventNames;

  for (let evtClassIdx = 0; evtClassIdx < eventClassifications.length; evtClassIdx++) {
    nativeEventNames = EventDenormalizeMap[eventClassifications[evtClassIdx]];

    for (let nativeClassIdx = 0; nativeClassIdx < nativeEventNames.length; nativeClassIdx++) {
      await cacher.client.hincrby(key, nativeEventNames[nativeClassIdx], adding ? 1 : -1);
    }
  }
};

/**
 * @param {import('moleculer').Cachers.Redis<import('ioredis').Redis>} cacher
 * @param {object} options
 * @param {string} options.connectTarget
 * @param {string} options.nativeEventName
 * @returns {Promise<boolean>}
 */
const hasListener = async (cacher, { connectTarget, nativeEventName }) => {
  const key = `${cacher.prefix}${KEY_PREFIX}:${connectTarget}`;

  const numListeningToEvent = Number(await cacher.client.hget(key, nativeEventName));

  return numListeningToEvent > 0;
};

module.exports = {
  hasListener,
  toggleEventTypesByClassifications
};
