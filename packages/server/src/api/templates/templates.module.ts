import { forwardRef, Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { Installation } from '../slack/entities/installation.entity';
import { State } from '../slack/entities/state.entity';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomersModule } from '../customers/customers.module';
import { SlackModule } from '../slack/slack.module';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ModalsModule } from '../modals/modals.module';
import { WebsocketsModule } from '../../websockets/websockets.module';
import { Step } from '../steps/entities/step.entity';
import { CacheService } from '../../common/services/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Installation,
      State,
      Step,
      Template,
    ]),
    forwardRef(() => CustomersModule),
    SlackModule,
    forwardRef(() => WebhooksModule),
    ModalsModule,
    forwardRef(() => WebsocketsModule),
  ],
  providers: [TemplatesService, CacheService],
  controllers: [TemplatesController],
  exports: [TemplatesService],
})
export class TemplatesModule {}
