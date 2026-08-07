import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { Database } from './entities/database.entity';
import { Integration } from './entities/integration.entity';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsProcessor } from './integrations.processor';
import { IntegrationsService } from './integrations.service';

function getProvidersList() {
  let providerList: Array<any> = [IntegrationsService];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    providerList = [...providerList, IntegrationsProcessor];
  }

  return providerList;
}

@Module({
  imports: [
    AccountsModule,
    TypeOrmModule.forFeature([Integration, Database])
  ],
  controllers: [IntegrationsController],
  providers: getProvidersList(),
  exports: [IntegrationsService],
})
export class IntegrationsModule { }
