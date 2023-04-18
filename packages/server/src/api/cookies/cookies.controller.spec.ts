import { Test, TestingModule } from '@nestjs/testing';
import { CookiesController } from './cookies.controller';

describe('CookiesController', () => {
  let controller: CookiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CookiesController],
    }).compile();

    controller = module.get<CookiesController>(CookiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
