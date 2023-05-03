import { Test, TestingModule } from '@nestjs/testing';
import { ModalsController } from './modals.controller';

describe('ModalsController', () => {
  let controller: ModalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModalsController],
    }).compile();

    controller = module.get<ModalsController>(ModalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
