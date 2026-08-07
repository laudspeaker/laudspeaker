import { Test, TestingModule } from '@nestjs/testing';
import { CacheService, CacheServiceInvalidValueError } from './cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { MockCacheService } from './__mocks__/mock-cache.service';
import { CacheConstants } from './cache.constants';

// to run: npm run test -- cache.service.spec --watch
describe('CacheService', () => {
  let cacheService: CacheService;
  let cache: Cache;

  let spyGet;
  let spySet;
  let spyDel;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useClass: MockCacheService,
        },
      ],
    }).compile();

    cacheService = app.get<CacheService>(CacheService);
    cache = app.get(CACHE_MANAGER);

    spyGet = jest.spyOn(cache, 'get');
    spySet = jest.spyOn(cache, 'set');
    spyDel = jest.spyOn(cache, 'del');
  });

  describe('get', () => {
    it('should get from cache with setter method', async () => {
      const uuid = randomUUID();

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      let value = await cacheService.get(CacheConstants.STEPS, uuid, async () => {
        return expectedValueInCache;
      });

      value = await cacheService.get(CacheConstants.STEPS, uuid, async () => {
        return 'NEWVALUE';
      });

      expect(spyGet).toHaveBeenCalledTimes(2);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(value).toEqual(expectedValueInCache);
    });

    it('should get undefined from cache without a setter method', async () => {
      const uuid = randomUUID();

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      let value = await cacheService.get(CacheConstants.STEPS, uuid);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(0);
      expect(value).toEqual(undefined);
    });

    it('should get value from cache that was pre-set without a setter method', async () => {
      const uuid = randomUUID();
      let key = `${CacheConstants.STEPS}:${uuid}`;

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      cache.set(key, expectedValueInCache);

      let value = await cacheService.get(CacheConstants.STEPS, uuid);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(value).toEqual(expectedValueInCache);
    });

    it('should throw an error when id is empty', async () => {
      const uuid = '';

      await expect(cacheService.get(CacheConstants.STEPS, uuid)).rejects.toThrow(
        CacheServiceInvalidValueError
      );

      expect(spyGet).toHaveBeenCalledTimes(0);
      expect(spySet).toHaveBeenCalledTimes(0);
      expect(spyDel).toHaveBeenCalledTimes(0);
    });
  });

  describe('getRaw', () => {
    it('should get value from cache with setter method', async () => {
      let key = 'some-cache-key';
      let expectedValueInCache = 'getRawTest';

      let value = await cacheService.getRaw(key, async () => {
        return expectedValueInCache;
      });

      value = await cacheService.getRaw(key, async () => {
        return 'NEWVALUE';
      });

      expect(spyGet).toHaveBeenCalledTimes(2);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(value).toEqual(expectedValueInCache);
    });

    it('should get undefined from cache without a setter method', async () => {
      let key = 'some-cache-key';

      let value = await cacheService.getRaw(key);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(0);
      expect(value).toEqual(undefined);
    });

    it('should get value from cache that was pre-set without a setter method', async () => {
      let key = 'some-cache-key';
      const uuid = randomUUID();

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      cache.set(key, expectedValueInCache);

      let value = await cacheService.getRaw(key);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(value).toEqual(expectedValueInCache);
    });

    it('should throw an error when cache key is empty', async () => {
      let key = '';

      await expect(cacheService.getRaw(key)).rejects.toThrow();

      expect(spyGet).toHaveBeenCalledTimes(0);
      expect(spySet).toHaveBeenCalledTimes(0);
      expect(spyDel).toHaveBeenCalledTimes(0);
    });
  });

  describe('getIgnoreError', () => {
    it('should get from cache with setter method', async () => {
      const uuid = randomUUID();

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      let value = await cacheService.getIgnoreError(CacheConstants.STEPS, uuid, async () => {
        return expectedValueInCache;
      });

      value = await cacheService.getIgnoreError(CacheConstants.STEPS, uuid, async () => {
        return 'NEWVALUE';
      });

      expect(spyGet).toHaveBeenCalledTimes(2);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(value).toEqual(expectedValueInCache);
    });

    it('should get undefined from cache without a setter method', async () => {
      const uuid = randomUUID();

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      let value = await cacheService.getIgnoreError(CacheConstants.STEPS, uuid);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(0);
      expect(value).toEqual(undefined);
    });

    it('should get value from cache that was pre-set without a setter method', async () => {
      const uuid = randomUUID();
      let key = `${CacheConstants.STEPS}:${uuid}`;

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      cache.set(key, expectedValueInCache);

      let value = await cacheService.getIgnoreError(CacheConstants.STEPS, uuid);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(value).toEqual(expectedValueInCache);
    });

    it('should not throw an error when id is empty', async () => {
      const uuid = '';

      let value = await cacheService.getIgnoreError(CacheConstants.STEPS, uuid);

      expect(spyGet).toHaveBeenCalledTimes(0);
      expect(spySet).toHaveBeenCalledTimes(0);
      expect(spyDel).toHaveBeenCalledTimes(0);
      expect(value).toEqual(undefined);
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const uuid = randomUUID();

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      await cacheService.set(CacheConstants.STEPS, uuid, async () => {
        return expectedValueInCache;
      });

      let value = await cacheService.get(CacheConstants.STEPS, uuid);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(value).toEqual(expectedValueInCache);
    });
  });

  describe('setRaw', () => {
    it('should set value in cache', async () => {
      const uuid = randomUUID();
      let key = `${CacheConstants.STEPS}:${uuid}`;

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      await cacheService.setRaw(key, async () => {
        return expectedValueInCache;
      });

      let value = await cacheService.getRaw(key);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(value).toEqual(expectedValueInCache);
    });
  });

  describe('delete', () => {
    it('should delete key that doesnt exist in cache', async () => {
      const uuid = randomUUID();
      let key = `${CacheConstants.STEPS}:${uuid}`;

      await cacheService.delete(CacheConstants.STEPS, uuid);

      let value = await cacheService.get(CacheConstants.STEPS, uuid);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(0);
      expect(spyDel).toHaveBeenCalledTimes(1);
      expect(value).toEqual(undefined);
    });

    it('should delete key that exists in cache', async () => {
      const uuid = randomUUID();
      let key = `${CacheConstants.STEPS}:${uuid}`;

      let expectedValueInCache = { id: uuid, type: 'waitUntil' };

      await cacheService.set(CacheConstants.STEPS, uuid, async () => {
        return expectedValueInCache;
      });

      await cacheService.delete(CacheConstants.STEPS, uuid);

      let value = await cacheService.get(CacheConstants.STEPS, uuid);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(spyDel).toHaveBeenCalledTimes(1);
      expect(value).toEqual(undefined);
    });
  });

  describe('deleteRaw', () => {
    it('should delete key that doesnt exist in cache', async () => {
      const uuid = randomUUID();
      let key = `some-random-cache-key`;

      await cacheService.deleteRaw(key);

      let value = await cacheService.getRaw(key);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(0);
      expect(spyDel).toHaveBeenCalledTimes(1);
      expect(value).toEqual(undefined);
    });

    it('should delete key that exists in cache', async () => {
      const uuid = randomUUID();
      let key = `some-random-cache-key`;

      let expectedValueInCache = randomUUID();

      await cacheService.setRaw(key, async () => {
        return expectedValueInCache;
      });

      await cacheService.deleteRaw(key);

      let value = await cacheService.getRaw(key);

      expect(spyGet).toHaveBeenCalledTimes(1);
      expect(spySet).toHaveBeenCalledTimes(1);
      expect(spyDel).toHaveBeenCalledTimes(1);
      expect(value).toEqual(undefined);
    });
  });
});
