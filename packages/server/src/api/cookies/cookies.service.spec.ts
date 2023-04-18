import { Test, TestingModule } from '@nestjs/testing';
import { CookiesService } from './cookies.service';

describe('CookiesService', () => {
  let service: CookiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookiesService],
    }).compile();

    service = module.get<CookiesService>(CookiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
