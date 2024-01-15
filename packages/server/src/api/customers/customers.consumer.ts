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
import {
  Customer,
  CustomerDocument,
  CustomerSchema,
} from './schemas/customer.schema';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

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
    @InjectQueue('events_pre')
    private readonly eventPreprocessorQueue: Queue,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private dataSource: DataSource
  ) {}

  private MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? 'nest'; // Confluent cluster API secret
  private MONGO_CUSTOMERS_TABLE_NAME = 'customers'; // no other way to configure since hardcoded, make sure it matches in CustomersService.constructor
  private MONGO_CHANGE_STREAM_CONSUMER_GROUP = 'laudspeaker-customers-change';

  async onApplicationBootstrap() {
    await this.consumerService.consume(
      { topics: [`${this.MONGO_DB_NAME}.${this.MONGO_CUSTOMERS_TABLE_NAME}`] },
      {
        groupId:
          process.env.NODE_ENV === 'development'
            ? new Date().toUTCString()
            : this.MONGO_CHANGE_STREAM_CONSUMER_GROUP,
      },
      {
        eachMessage: this.handleCustomerChangeStream(),
      }
    );
  }

  private handleCustomerChangeStream(this: CustomersConsumerService) {
    return async (changeMessage: EachMessagePayload) => {
      try {
        const messStr = changeMessage.message.value.toString();
        let message: ChangeStreamDocument<Customer> = JSON.parse(messStr);
        if (typeof message === 'string') {
          message = JSON.parse(message); //double parse if kafka record is published as string not object
        }
        const session = randomUUID();
        let account: Account;
        let customer: CustomerDocument;
        const queryRunner = await this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const clientSession = await this.connection.startSession();
        await clientSession.startTransaction();
        try {
          switch (message.operationType) {
            case 'insert':
            case 'update':
            case 'replace':
              customer = await this.customersService.findByCustomerId(
                message.documentKey._id['$oid'],
                clientSession
              );
              if (!customer) {
                this.logger.warn(
                  `No customer with id ${message.documentKey._id['$oid']}. Can't process ${CustomersConsumerService.name}.`
                );
                break;
              }
              account =
                await this.accountsService.findOrganizationOwnerByWorkspaceId(
                  customer.workspaceId,
                  session
                );
              await this.segmentsService.updateCustomerSegments(
                account,
                customer.id,
                session,
                queryRunner
              );
              await this.journeysService.updateEnrollmentForCustomer(
                account,
                customer.id,
                message.operationType === 'insert' ? 'NEW' : 'CHANGE',
                session,
                queryRunner,
                clientSession
              );

              if (message.operationType === 'update')
                await this.eventPreprocessorQueue.add('wu_attribute', {
                  account: account,
                  session: session,
                  message,
                });
              break;
            case 'delete': {
              // TODO_JH: remove customerID from all steps also
              const customerId = message.documentKey._id['$oid'];
              await this.segmentsService.removeCustomerFromAllSegments(
                customerId,
                queryRunner
              );
              break;
            }
          }
          await clientSession.commitTransaction();
          await clientSession.endSession();
          await queryRunner.commitTransaction();
          await queryRunner.release();
        } catch (e) {
          if (clientSession && clientSession.inTransaction)
            await clientSession.abortTransaction();
          if (clientSession && !clientSession.hasEnded)
            await clientSession.endSession();
          if (queryRunner && queryRunner.isTransactionActive)
            await queryRunner.rollbackTransaction();
          if (queryRunner && !queryRunner.isReleased)
            await queryRunner.release();
          throw e;
        }
      } catch (e) {
        this.logger.error(
          `Something went wrong processing mongo change stream message ${changeMessage.message.value.toString()}.`,
          e
        );
      }
    };
  }
}
