/**
 * @typedef {Object} SocketDataCache
 * @property {number} socketId
 * @property {string} target
 * @property {string[]} eventClassifications
 */

const MAX_KEY_FIND = 100; //!FIXME - Need to test limits in conjunction with APIs/integrations (ie, twitch has connectivity limits)
const KEY_COUNTER_PLATFORM = 'connectedTTL';
const KEY_COUNTER_TARGET = 'connectedTo';
const KEY_REGISTERED = 'registered';

/**
 * @param {import('moleculer').Cachers.Redis<import('ioredis').Redis>} cacher
 * @param {object} options
 * @param {string} options.platformName
 * @param {string} options.connectTarget
 * @param {string} options.searchKey
 * @returns {Promise<SocketDataCache[]>}
 */
const getRegistrationsForTargetByKey = (cacher, { platformName, connectTarget, searchKey }) => {
  return new Promise((resolve, reject) => {
    const sockets = [];
    const stream = cacher.client.scanStream({
      match: searchKey,
      count: MAX_KEY_FIND
    });

    stream.on('error', reject);
    stream.on('data', (keys = []) => sockets.push(...keys));
    stream.on('end', async function () {
      let socketId;
      for (let x = 0; x < sockets.length; x++) {
        socketId = sockets[x]
          .replace(cacher.prefix, '')
          .replace(`${KEY_REGISTERED}:`, '')
          .replace(`${platformName}-${connectTarget}-`, '');

        sockets[x] = {
          socketId,
          // Retrieve the actual data for the key
          eventClassifications: await cacher.client.get(sockets[x]),
          // Strip all meta/junk except the {platform-target} text
          target: sockets[x].replace(cacher.prefix, '').replace(`${KEY_REGISTERED}:`, '').replace(`-${socketId}`, '')
        };
      }

      resolve(sockets);
    });
  });
};

/**
 * @param {import('moleculer').Cachers.Redis<import('ioredis').Redis>} cacher
 * @param {object} options
 * @param {string} options.platformName
 * @param {string} options.connectTarget
 * @param {object} options.eventClassification
 * @param {string} options.eventClassification.category
 * @param {string} options.eventClassification.subCategory
 * @returns {Promise<SocketDataCache[]>}
 */
const getSocketsAwaitingEventForConnectTarget = async (
  cacher,
  { eventClassification: { category, subCategory }, platformName, connectTarget }
) => {
  const fqcn = `${category}.${subCategory}`;
  const socketsForConnectTarget = await getRegistrationsForTargetByKey(cacher, {
    platformName,
    connectTarget,
    searchKey: `${cacher.prefix}${KEY_REGISTERED}:${platformName}-${connectTarget}*`
  });

  return socketsForConnectTarget.reduce((sockets, sData) => {
    if (sData.eventClassifications.includes(fqcn)) {
      sockets.push(sData.socketId);
    }

    return sockets;
  }, []);
};

/**
 * @param {import('moleculer').Cachers.Redis<import('ioredis').Redis>} cacher
 * @param {object} options
 * @param {string} options.platformName
 * @param {string} options.connectTarget
 * @param {string} options.socketId
 * @returns {Promise<import('golden-hammer-shared').PubSubConnectionResponse | null>}
 */
const checkIfSocketRegisteredForTarget = async (cacher, { connectTarget, platformName, socketId }) => {
  const isSocketRegisteredForTarget = await cacher.get(
    `${KEY_REGISTERED}:${platformName}-${connectTarget}-${socketId}`
  );

  // Can't unregister something we're not registered for!
  if (!isSocketRegisteredForTarget) {
    const errMsg = `${platformName}->${connectTarget} was never registered for this client!`;

    return {
      unregistered: false,
      error: errMsg,
      type: 'messaging',
      pubsub: {
        connectTarget,
        //@ts-ignore
        platformName
      }
    };
  }

  return null;
};

/**
 * @param {import('moleculer').Cachers.Redis<import('ioredis').Redis>} cacher
 * @param {object} options
 * @param {string} options.target
 * @param {string} options.socketId
 * @param {string[]} options.eventClassifications
 * @returns {Promise<number>}
 */
const cacheTargetForSocket = async (cacher, { target, socketId, eventClassifications }) => {
  await cacher.set(`${KEY_REGISTERED}:${target}-${socketId}`, eventClassifications);

  await cacher.client.incr(`${cacher.prefix}${KEY_COUNTER_PLATFORM}:${target.split('-')[0]}`);

  return await cacher.client.incr(`${cacher.prefix}${KEY_COUNTER_TARGET}:${target}`);
};

/**
 * @param {import('moleculer').Cachers.Redis<import('ioredis').Redis>} cacher
 * @param {object} options
 * @param {string} options.target
 * @param {string} options.socketId
 * @returns {Promise<number>}
 */
const uncacheTargetForSocket = async (cacher, { target, socketId }) => {
  await cacher.del(`${KEY_REGISTERED}:${target}-${socketId}`);
  const numLeft = await cacher.client.decr(`${cacher.prefix}${KEY_COUNTER_TARGET}:${target}`);

  await cacher.client.decr(`${cacher.prefix}${KEY_COUNTER_PLATFORM}:${target.split('-')[0]}`);

  // Kill key if we don't have any other listeners
  if (0 === numLeft) {
    cacher.del(`${KEY_COUNTER_TARGET}:${target}`);
  }

  return numLeft;
};

// Exports!
module.exports = {
  KEY_REGISTERED,
  cacheTargetForSocket,
  checkIfSocketRegisteredForTarget,
  getRegistrationsForTargetByKey,
  getSocketsAwaitingEventForConnectTarget,
  uncacheTargetForSocket
};
