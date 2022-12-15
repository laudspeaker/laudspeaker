import { Test, TestingModule } from '@nestjs/testing';
import { SegmentsService } from './segments.service';

describe('SegmentsService', () => {
  let service: SegmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SegmentsService],
    }).compile();

    service = module.get<SegmentsService>(SegmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
