import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { EachMessagePayload } from 'kafkajs';
import mongoose from 'mongoose';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ChangeStreamDocument, DataSource } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { JourneysService } from '../journeys/journeys.service';
import { KafkaConsumerService } from '../kafka/consumer.service';
import { SegmentsService } from '../segments/segments.service';
import { CustomersService } from './customers.service';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersConsumerService implements OnApplicationBootstrap {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly consumerService: KafkaConsumerService,
    private readonly customersService: CustomersService,
    private readonly journeysService: JourneysService,
    private readonly accountsService: AccountsService,
    private readonly segmentsService: SegmentsService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private dataSource: DataSource
  ) {}

  async onApplicationBootstrap() {
    await this.consumerService.consume(
      { topics: ['nest.customers'] },
      { groupId: new Date().toString() },
      {
        eachMessage: this.handleCustomerChangeStream(),
      }
    );
  }

  private handleCustomerChangeStream(this: CustomersConsumerService) {
    return async (changeMessage: EachMessagePayload) => {
      let messStr = changeMessage.message.value.toString();
      let message: ChangeStreamDocument<Customer> = JSON.parse(
        JSON.parse(messStr)
      ); //double parse because single parses it to just string ?? TODO_JH figure out why that's the case
      const session = randomUUID();
      let account: Account;
      let customer: CustomerDocument;
      let queryRunner = await this.dataSource.createQueryRunner();
      queryRunner.connect();
      queryRunner.startTransaction();
      let transactionSession = await this.connection.startSession();
      transactionSession.startTransaction();
      switch (message.operationType) {
        case 'insert':
        case 'update':
        case 'replace':
          account = await this.accountsService.findOne(
            { id: message.fullDocument.ownerId },
            session
          );
          customer = await this.customersService.findById(
            account,
            message.documentKey._id['$oid']
          );
          await this.segmentsService.updateCustomerSegments(
            account,
            customer.id,
            session
          );
          await this.journeysService.updateEnrollmentForCustomer(
            account,
            customer.id,
            message.operationType === 'insert' ? 'NEW' : 'CHANGE',
            session
          );
        case 'delete':
          // TODO_JH: remove customerID from all steps also
          let customerId = message.documentKey._id['$oid'];
          this.segmentsService.removeCustomerFromAllSegments(customerId);
      }
      transactionSession.commitTransaction();
      queryRunner.commitTransaction();
    };
  }
}

