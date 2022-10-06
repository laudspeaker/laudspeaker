import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer, CustomerSchema } from './schemas/customer.schema';

describe('CustomersController', () => {
  let controller: CustomersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        MongooseModule.forRoot(process.env.MONGOOSE_URL),
        TypeOrmModule.forFeature([Audience]),
        MongooseModule.forFeature([
          { name: Customer.name, schema: CustomerSchema },
        ]),
      ],
      controllers: [CustomersController],
      providers: [CustomersService],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
