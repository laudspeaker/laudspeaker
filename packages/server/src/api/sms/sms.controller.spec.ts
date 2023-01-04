import { Test, TestingModule } from '@nestjs/testing';
import { SmsController } from './sms.controller';

describe('SmsController', () => {
  let controller: SmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsController],
    }).compile();

    controller = module.get<SmsController>(SmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
