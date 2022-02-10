/**
 * Data Flow: Structures
 *
 * --------------------------------------------
 * Register PubSub
 * --------------------------------------------
 *
 * Incoming Data:
 * {
 *    platformName: 'twitch',
 *    connectTarget: 'nfgCodex',
 *    eventNames: ['UserChat', 'Monetization']
 * },
 * {
 *    meta: { socketId: '928_75$9$28759275'}
 * }
 *
 * --------------------------------------------
 * UnRegister PubSub
 * --------------------------------------------
 * {
 *    platformName: 'twitch',
 *    connectTarget: 'nfgCodex'
 * },
 * {
 *    meta: { socketId: '928_75$9$28759275'}
 * }
 *
 * --------------------------------------------
 * Platform Events
 * --------------------------------------------
 *
 * {
 *    connectTarget: 'string',
 *    platform: {
 *      name,
 *      eventName,
 *      eventData
 *    },
 *    eventCategory: 'string',
 *    normalizedData: 'any'
 * }
 *
 * --------------------------------------------
 * Disconnection
 * --------------------------------------------
 * {
 *    socketId: '928_75$9$28759275'
 * }
 *
 */

const PUBSUB_CACHE = {
  /*
    {
      [platformName]: {
        [connectTarget]: [socketIds]
      }
    }
    */
  platformToSocketIds: new Map(),
  /*
    {
      [socketId]: {
        [platformName]: [connectTarget]
      }
    }
    */
  socketIdToConnectTargets: new Map(),
  /*
    {
      [socketId]: {
        [platformName]: {
          [connectTarget]: ['UserChat', '...']
        }
      }
    }
    */
  socketIdToEventCategories: new Map()
};

const registerSocketIdToPlatformNameAndConnectTarget = ({
  socketId,
  platformName,
  connectTarget,
  eventCategories,
  connectTargetSocketIds,
  platformSocketIds
}) => {
  let socketIdPlatforms, socketIdConnectTargets;

  // Store our platformName->connectTarget->[socketId] association
  connectTargetSocketIds.add(socketId);
  platformSocketIds.set(connectTarget, connectTargetSocketIds);
  PUBSUB_CACHE.platformToSocketIds.set(platformName, platformSocketIds);

  // Store our socketId->platformName->[connectTarget]
  socketIdPlatforms = PUBSUB_CACHE.socketIdToConnectTargets.get(socketId) || new Map();
  socketIdConnectTargets = socketIdPlatforms.get(platformName) || new Set();
  socketIdConnectTargets.add(connectTarget);
  socketIdPlatforms.set(platformName, socketIdConnectTargets);
  PUBSUB_CACHE.socketIdToConnectTargets.set(socketId, socketIdPlatforms);

  // Store our socketId->platformName->connectTarget->[eventCategories]
  socketIdPlatforms = PUBSUB_CACHE.socketIdToEventCategories.get(socketId) || new Map();
  socketIdConnectTargets = socketIdPlatforms.get(platformName) || new Map();
  socketIdConnectTargets.set(connectTarget, eventCategories);
  socketIdPlatforms.set(platformName, socketIdConnectTargets);
  PUBSUB_CACHE.socketIdToEventCategories.set(socketId, socketIdPlatforms);
};

const unregisterSocketFromConnectTargetAndPlatformName = ({
  platformName,
  socketId,
  connectTarget,
  socketIdPlatformConnectTargetMap,
  socketIdConnectTargets
}) => {
  const connectTargetMapForPlatforms = PUBSUB_CACHE.platformToSocketIds.get(platformName) || new Map();
  const platformMapToEventCategoriesForSocketId = PUBSUB_CACHE.socketIdToEventCategories.get(socketId) || new Map();
  const connectTargetSocketIds = connectTargetMapForPlatforms.get(connectTarget) || new Set();
  const socketIdConnectTargetMap = platformMapToEventCategoriesForSocketId.get(platformName) || new Map();

  let numSocketsLeft = 0;

  // ! Remove socketId->platformName->[connectTarget] (socketIdToConnectTargets)
  // No more connectTargets for the platform, kill the entire Map
  if (1 === socketIdConnectTargets.size) {
    socketIdPlatformConnectTargetMap.delete(platformName);
  } else {
    // More connectTargets, so we'll just remove this one!
    socketIdConnectTargets.delete(connectTarget);
  }

  // ! Remove platformName->connectTarget->[socketId] (platformToSocketIds)
  // No more socketIds for the connectTarget, kill the entire Map
  if (1 === connectTargetSocketIds.size) {
    connectTargetMapForPlatforms.delete(connectTarget);
  } else {
    // More socketIds, so we'll just remove this one!
    connectTargetSocketIds.delete(socketId);
    numSocketsLeft = connectTargetSocketIds.size;
  }

  // ! Remove socketId->platformName->connectTarget->[eventCategories] (socketIdToEventCategories)
  // No more connectTargets for the socketId (on this platform), kill the entire Map
  if (1 === socketIdConnectTargetMap.size) {
    platformMapToEventCategoriesForSocketId.delete(platformName);
  } else {
    // More socketIds, so we'll just remove this one!
    socketIdConnectTargetMap.delete(connectTarget);
  }

  // ! Cleanup of empty socket leaf values
  if (0 === socketIdPlatformConnectTargetMap.size) {
    PUBSUB_CACHE.socketIdToConnectTargets.delete(socketId);
  }

  if (0 === platformMapToEventCategoriesForSocketId.size) {
    PUBSUB_CACHE.socketIdToEventCategories.delete(socketId);
  }

  return numSocketsLeft === 0;
};

const getSocketIdsForEventCategoryOnPlatformNameForConnectTarget = ({
  eventClassification: { category },
  platformName,
  connectTarget
}) => {
  // Get all socketIds for platformName->connectTarget->[socketIds] association
  const platformConnectTargetMap = PUBSUB_CACHE.platformToSocketIds.get(platformName) || new Map();
  let connectTargetSocketIds = platformConnectTargetMap.get(connectTarget) || new Set();
  connectTargetSocketIds = [...connectTargetSocketIds];

  return connectTargetSocketIds.reduce((_socketIds, socketId) => {
    const socketIdPlatformMap = PUBSUB_CACHE.socketIdToEventCategories.get(socketId);
    const socketIdConnectTargetMap = socketIdPlatformMap.get(platformName);
    const socketIdEventCategories = socketIdConnectTargetMap.get(connectTarget);

    if (socketIdEventCategories.includes(category)) {
      _socketIds.push(socketId);
    }

    return _socketIds;
  }, []);
};

const getConnectTargetInfoOnPlatformForSocketId = (socketId, platformName) => {
  const socketIdPlatformConnectTargetMap = PUBSUB_CACHE.socketIdToConnectTargets.get(socketId) || new Map();
  const socketIdConnectTargets = socketIdPlatformConnectTargetMap.get(platformName) || new Set();

  return { socketIdPlatformConnectTargetMap, socketIdConnectTargets };
};

const getSocketIdsForConnectTargetOnPlatform = (platformName, connectTarget) => {
  const platformSocketIds = PUBSUB_CACHE.platformToSocketIds.get(platformName) || new Map();
  const connectTargetSocketIds = platformSocketIds.get(connectTarget) || new Set();

  return {
    platformSocketIds,
    connectTargetSocketIds
  };
};

const getConnectTargetMapForSocketId = socketId => {
  return PUBSUB_CACHE.socketIdToConnectTargets.get(socketId) || new Map();
};

module.exports = {
  getSocketIdsForConnectTargetOnPlatform,
  getConnectTargetInfoOnPlatformForSocketId,
  getConnectTargetMapForSocketId,
  registerSocketIdToPlatformNameAndConnectTarget,
  unregisterSocketFromConnectTargetAndPlatformName,
  getSocketIdsForEventCategoryOnPlatformNameForConnectTarget
};
