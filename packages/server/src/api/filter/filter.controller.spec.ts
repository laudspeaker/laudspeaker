import { Test, TestingModule } from '@nestjs/testing';
import { FilterController } from './filter.controller';
import { FilterService } from './filter.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Filter } from './entities/filter.entity';
import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';

describe('FilterController', () => {
  let controller: FilterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        TypeOrmModule.forFeature([Filter]),
      ],
      controllers: [FilterController],
      providers: [FilterService],
    }).compile();

    controller = module.get<FilterController>(FilterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
