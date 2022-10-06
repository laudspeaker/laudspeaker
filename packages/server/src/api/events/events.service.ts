import { Injectable, Inject } from '@nestjs/common';
import { Correlation, CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { EventsTable, CustomEventTable } from './interfaces/event.interface';
import { Account } from '../accounts/entities/accounts.entity';

@Injectable()
export class EventsService {
  constructor(
    @Inject(CustomersService)
    private readonly customersService: CustomersService
  ) {}

  async correlate(
    account: Account,
    ev: EventsTable
  ): Promise<CustomerDocument> {
    return this.customersService.findByExternalIdOrCreate(
      account,
      ev.userId ? ev.userId : ev.anonymousId
    );
  }

  async correlateCustomEvent(
    account: Account,
    ev: CustomEventTable
  ): Promise<Correlation> {
    return this.customersService.findByCustomEvent(account, ev.slackId);
  }
}
