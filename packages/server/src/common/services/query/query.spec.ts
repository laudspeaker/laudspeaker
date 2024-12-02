import { Test, TestingModule } from '@nestjs/testing';
import { Query, QueryService } from './';

describe('QueryService', () => {
  // let cacheService: CacheService;
  // let cache: Cache;

  // let spyGet;
  // let spySet;
  // let spyDel;

  beforeEach(async () => {
    // const app = await Test.createTestingModule({
    //   providers: [
    //     CacheService,
    //     {
    //       provide: CACHE_MANAGER,
    //       useClass: MockCacheService,
    //     },
    //   ],
    // }).compile();

    // cacheService = app.get<CacheService>(CacheService);
    // cache = app.get(CACHE_MANAGER);

    // spyGet = jest.spyOn(cache, 'get');
    // spySet = jest.spyOn(cache, 'set');
    // spyDel = jest.spyOn(cache, 'del');
  });

  // describe('get', () => {
  //   it('should get from cache with setter method', async () => {
  //     const uuid = randomUUID();

  //     let expectedValueInCache = { id: uuid, type: 'waitUntil' };

  //     let value = await cacheService.get(CacheConstants.STEPS, uuid, async () => {
  //       return expectedValueInCache;
  //     });

  //     value = await cacheService.get(CacheConstants.STEPS, uuid, async () => {
  //       return 'NEWVALUE';
  //     });

  //     expect(spyGet).toHaveBeenCalledTimes(2);
  //     expect(spySet).toHaveBeenCalledTimes(1);
  //     expect(value).toEqual(expectedValueInCache);
  //   });
  // });
});
