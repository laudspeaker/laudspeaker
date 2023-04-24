import { Test, TestingModule } from '@nestjs/testing';
import { ModalsService } from './modals.service';

describe('ModalsService', () => {
  let service: ModalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModalsService],
    }).compile();

    service = module.get<ModalsService>(ModalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
