import { AccountsModule } from '../api/accounts/accounts.module';
import { CustomersModule } from '..//api/customers/customers.module';
import { EventsModule } from '../api/events/events.module';
import { forwardRef, Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [
    forwardRef(() => AccountsModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => EventsModule),
  ],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketsModule {}
