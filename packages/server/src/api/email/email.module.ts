import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { MessageProcessor } from './email.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomersModule } from '../customers/customers.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

function getProvidersList() {
  let providerList: Array<any> = [];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    providerList = [...providerList, MessageProcessor];
  }

  return providerList;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    CustomersModule,
    WebhooksModule,
  ],
  controllers: [EmailController],
  providers: getProvidersList(),
})
export class EmailModule {}
