import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketsService } from './websockets.service';

describe('WebsocketsService', () => {
  let service: WebsocketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketsService],
    }).compile();

    service = module.get<WebsocketsService>(WebsocketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
