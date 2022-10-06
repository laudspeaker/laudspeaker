import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomersService } from '../customers/customers.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
    TypeOrmModule.forFeature([Account]),
    TypeOrmModule.forFeature([Audience]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailProcessor, CustomersService],
})
export class EmailModule {}
