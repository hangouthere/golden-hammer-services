jest.mock('ioredis');
jest.mock('moleculer');

const moleculer = require('moleculer');
const ioredis = require('ioredis');

const RegisterCache = require('@/services/gh-pubsub/RegisterCache');

let {
  cacheTargetForSocket,
  checkIfSocketRegisteredForTarget,
  getRegistrationsForTargetByKey,
  getSocketDataCacheAwaitingEventForConnectTarget,
  uncacheTargetForSocket
} = RegisterCache;

const MOCKDATA = {
  regData: {
    target: 'platform-target',
    socketId: 'fakeSocketId',
    eventClassifications: ['class1', 'class2']
  },
  checkData: {
    platformName: 'testPlatform',
    connectTarget: 'testConnectTarget',
    socketId: 'fakeSocketId'
  }
};

describe('Service: gh-pubsub: RegisterCache', () => {
  let cacher, client;
  beforeEach(() => {
    cacher = new moleculer.Cachers.Redis();
    client = new ioredis();
    cacher.prefix = 'test-';
    cacher.client = client;
  });

  describe('Adding Cache', () => {
    it('should set target-socket association key with eventClassifications', async () => {
      await cacheTargetForSocket(cacher, MOCKDATA.regData);

      expect(cacher.set).toHaveBeenCalledWith('registered:platform-target-fakeSocketId', ['class1', 'class2']);
      expect(cacher.client.incr).toHaveBeenCalledWith('test-connectedPlatform:platform');
      expect(cacher.client.incr).toHaveBeenCalledWith('test-connectedTarget:platform-target');
    });
  });

  describe('Removing Cache', () => {
    it('should remove known cache keys', async () => {
      await uncacheTargetForSocket(cacher, MOCKDATA.regData);

      expect(cacher.del).toHaveBeenCalledWith('registered:platform-target-fakeSocketId');
      expect(cacher.client.decr).toHaveBeenCalledWith('test-connectedPlatform:platform');
      expect(cacher.client.decr).toHaveBeenCalledWith('test-connectedTarget:platform-target');
    });

    it('should not delete the counter if there are more listeners', async () => {
      // Return 42 listeners still connected!
      cacher.client.decr.mockReturnValue(42);

      await uncacheTargetForSocket(cacher, MOCKDATA.regData);

      expect(cacher.del).not.toHaveBeenCalledWith('connectedTarget:platform-target');
    });

    it('should delete the counter if there are no more listeners', async () => {
      // Return 0 listeners still connected!
      cacher.client.decr.mockReturnValue(0);

      await uncacheTargetForSocket(cacher, MOCKDATA.regData);

      expect(cacher.del).toHaveBeenCalledWith('connectedTarget:platform-target');
    });
  });

  describe('Checking Cache', () => {
    it('should return null if registered', async () => {
      cacher.get.mockReturnValue(true);

      await expect(checkIfSocketRegisteredForTarget(cacher, MOCKDATA.checkData)).resolves.toBeNull();

      expect(cacher.get).toHaveBeenCalledWith('registered:testPlatform-testConnectTarget-fakeSocketId');
    });

    it('should return an error response if not registered', async () => {
      cacher.get.mockReturnValue(null);

      await expect(checkIfSocketRegisteredForTarget(cacher, MOCKDATA.checkData)).resolves.toMatchSnapshot();

      expect(cacher.get).toHaveBeenCalledWith('registered:testPlatform-testConnectTarget-fakeSocketId');
    });

    it('should return matching Socket Data Cache matching classifications', async () => {
      await expect(
        getSocketDataCacheAwaitingEventForConnectTarget(
          cacher,
          {
            ...MOCKDATA.checkData,
            // Looking for EC = class1
            eventClassification: 'class1'
          },
          // override functional injection for
          // getRegistrationsForTargetByKey
          jest.fn().mockResolvedValue([MOCKDATA.regData])
        )
      )
        .resolves // Should return the id's matching, aka [1]
        .toEqual(['fakeSocketId']);
    });

    it('should return no Socket Data Cache when there are no matching classifications', async () => {
      await expect(
        getSocketDataCacheAwaitingEventForConnectTarget(
          cacher,
          {
            ...MOCKDATA.checkData,
            // Looking for EC = class1
            eventClassification: 'class9'
          },
          // override functional injection for
          // getRegistrationsForTargetByKey
          jest.fn().mockResolvedValue([MOCKDATA.regData])
        )
      )
        .resolves // Should return the id's matching, aka []
        .toEqual([]);
    });

    describe('Key Scanning', () => {
      let cbMap = {};
      beforeEach(() => {
        client.scanStream.mockReturnValue({
          on: (eventName, func) => (cbMap[eventName] = func)
        });
      });

      it('should return keys *assuming* matching a search key', async () => {
        const promise = getRegistrationsForTargetByKey(cacher, { ...MOCKDATA.checkData, searchKey: 'testSearchKey' });

        cacher.client.get.mockReturnValue(['class1', 'class3']);

        // Fake-trigger events to process before resolving
        cbMap.data('test-registered:testPlatform-testConnectTarget-fakeSocketId');
        cbMap.end();
        // Finally resolve, and eval tests
        await promise;

        expect(cacher.client.get).toHaveBeenCalledWith('test-registered:testPlatform-testConnectTarget-fakeSocketId');

        expect(promise).resolves.toMatchSnapshot();
      });

      it('should return empty array *assuming* when not matching a search key', async () => {
        const promise = getRegistrationsForTargetByKey(cacher, { ...MOCKDATA.checkData, searchKey: 'testSearchKey' });

        // Fake-trigger events to process before resolving
        cbMap.end();
        // Finally resolve, and eval tests
        await promise;

        expect(promise).resolves.toEqual([]);
      });
    });
  });
});
