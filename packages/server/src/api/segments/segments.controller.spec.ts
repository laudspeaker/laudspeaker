import { Test, TestingModule } from '@nestjs/testing';
import { SegmentsController } from './segments.controller';

describe('SegmentsController', () => {
  let controller: SegmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SegmentsController],
    }).compile();

    controller = module.get<SegmentsController>(SegmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
