import { Test, TestingModule } from '@nestjs/testing';
import { FilterService } from './filter.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { Filter } from './entities/filter.entity';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        TypeOrmModule.forFeature([Filter]),
      ],
      providers: [FilterService],
    }).compile();

    service = module.get<FilterService>(FilterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
