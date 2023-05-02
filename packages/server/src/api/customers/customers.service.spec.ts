import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import { BullModule } from '@nestjs/bullmq';

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
          },
        }),
        BullModule.registerQueue({
          name: 'customers',
        }),
        WinstonModule.forRootAsync({
          useFactory: () => ({
            level: 'debug',
            transports: [
              new winston.transports.Console({
                handleExceptions: true,
                format: winston.format.combine(
                  winston.format.colorize(),
                  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
                ),
              }),
            ],
          }),
          inject: [],
        }),
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

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
