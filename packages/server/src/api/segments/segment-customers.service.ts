import { Logger, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindManyOptions,
  QueryRunner,
  Repository,
  In
} from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Readable } from 'node:stream';
import * as copyFrom from 'pg-copy-streams';
import { SegmentCustomers } from './entities/segment-customers.entity';
import { Segment } from './entities/segment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Query } from '../../common/services/query';
import { CustomersService } from '../customers/customers.service';

const LOCATION_LOCK_TIMEOUT_MS = +process.env.LOCATION_LOCK_TIMEOUT_MS;

@Injectable()
export class SegmentCustomersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Segment)
    public segmentRepository: Repository<Segment>,
    @InjectRepository(SegmentCustomers)
    public segmentCustomersRepository: Repository<SegmentCustomers>,
    @InjectRepository(Account)
    public accountRepository: Repository<Account>,
    @Inject(forwardRef(()=>CustomersService))
    private customersService: CustomersService
  ) { }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: SegmentCustomersService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: SegmentCustomersService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: SegmentCustomersService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: SegmentCustomersService.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: SegmentCustomersService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  /**
   * Adds customers to an empty segment based on a query
   *
   * @param {Account} account Associated Account
   * @param {Segment} journey Associated Journey
   * @param {Query} query to fetch customers
   * @param {string} session HTTP session token
   * @param {QueryRunner}  Postgres Transaction
   * @returns
   */
  async populateEmptySegment(
    segment: Segment,
    query: Query,
    session: string,
    account: Account,
    queryRunner: QueryRunner
  ) {
    this.log(
      JSON.stringify({
        info: `Adding customers with query ${query.toSQL()} to segment ${segment.id}`,
      }),
      this.populateEmptySegment.name,
      session,
      account.email
    );

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    // query.select(['Date.now()', segment.id, 'id', workspace.id]);
    // todo: something better than this
    const queryStr = `
        INSERT INTO
        segment_customers ("segmentEntry", segment_id, customer_id, workspace_id)
          SELECT
            cast(extract(epoch from NOW()::date) as bigint),
            '${segment.id}',
            id,
            '${workspace.id}'
          FROM (${query.toSQL()})`;

    this.log(`Full Query: ${queryStr}`,
      this.populateEmptySegment.name,
      session,
      account.email
    );

    const result = await queryRunner.manager.query(queryStr);
  }

  async deleteFromSingleSegment(
    segment: Segment,
    customer: Customer,
    session: string,
    account: Account,
    queryRunner?: QueryRunner
  ) {
    this.log(
      JSON.stringify({
        info: `Removing customer ${customer.id} from segment ${segment.id}`,
      }),
      this.deleteFromSingleSegment.name,
      session,
      account.email
    );

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (queryRunner) {
      // Step 1: Check if customer is already enrolled in Journey; if so, throw error
      const location = await queryRunner.manager.findOne(SegmentCustomers, {
        where: {
          segment_id: segment.id,
          workspace_id: workspace.id,
          customer_id: customer.id,
        },
      });

      if (location)
        throw new Error(
          `Customer ${customer.id} already a part of segment ${segment.id}`
        );

      // Step 2: Create new journey Location row, add time that user entered the journey
      await queryRunner.manager.save(SegmentCustomers, {
        segment_id: segment.id,
        workspace,
        customer_id: customer.id,
        segmentEntry: Date.now(),
      });
    } else {
      const location = await this.segmentCustomersRepository.findOne({
        where: {
          segment_id: segment.id,
          workspace_id: workspace.id,
          customer_id: customer.id,
        },
      });
      if (location)
        throw new Error(
          `Customer ${customer.id} already a part of segment ${segment.id}`
        );
      await this.segmentCustomersRepository.save({
        segment_id: segment.id,
        workspace,
        customer_id: customer.id,
        segmentEntry: Date.now(),
      });
    }
  }

  async deleteFromAllSegments(
    segment: Segment,
    customer: Customer,
    session: string,
    account: Account,
    queryRunner?: QueryRunner
  ) {
    this.log(
      JSON.stringify({
        info: `Removing customer ${customer.id} from segment ${segment.id}`,
      }),
      this.deleteFromAllSegments.name,
      session,
      account.email
    );

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (queryRunner) {
      // Step 1: Check if customer is already enrolled in Journey; if so, throw error
      const location = await queryRunner.manager.findOne(SegmentCustomers, {
        where: {
          segment_id: segment.id,
          workspace_id: workspace.id,
          customer_id: customer.id,
        },
      });

      if (location)
        throw new Error(
          `Customer ${customer.id} already a part of segment ${segment.id}`
        );

      // Step 2: Create new journey Location row, add time that user entered the journey
      await queryRunner.manager.save(SegmentCustomers, {
        segment_id: segment.id,
        workspace,
        customer_id: customer.id,
        segmentEntry: Date.now(),
      });
    } else {
      const location = await this.segmentCustomersRepository.findOne({
        where: {
          segment_id: segment.id,
          workspace_id: workspace.id,
          customer_id: customer.id,
        },
      });
      if (location)
        throw new Error(
          `Customer ${customer.id} already a part of segment ${segment.id}`
        );
      await this.segmentCustomersRepository.save({
        segment_id: segment.id,
        workspace,
        customer_id: customer.id,
        segmentEntry: Date.now(),
      });
    }
  }

  async addBulk(
    segmentID: string,
    query: Query,
    session: string,
    account: Account,
    client: any
  ): Promise<void> {
    // if (!customers.length) return;
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    const segmentEntry = Date.now();


    // // Create a readable stream from the array od customer IDs
    // const readableStream = new Readable({
    //   read() {
    //     customers.forEach((customerId) => {
    //       this.push(
    //         `${segmentID}\t${customerId}\t${workspace.id}\t${segmentEntry}\n`
    //       );
    //     });
    //     this.push(null);
    //   },
    // });

    // const stream = client.query(
    //   copyFrom.from(
    //     `COPY segment_customers ("segmentId", "customerId", "workspaceId", "segmentEntry") FROM STDIN WITH (FORMAT text)`
    //   )
    // );

    // // Error handling
    // stream.on('error', (error) => {
    //   this.error(error, this.addBulk.name, session, account.email);
    //   throw error;
    // });
    // stream.on('finish', () => {
    //   this.debug(
    //     `Finished creating segment rows for ${segmentID}`,
    //     this.addBulk.name,
    //     session,
    //     account.email
    //   );
    // });

    // // Pipe the readable stream to the COPY command
    // readableStream.pipe(stream);
  }

  async removeBulk(
    segmentID: string,
    customers: string[],
    session: string,
    account: Account,
    client: any
  ): Promise<void> {
    if (!customers.length) return;
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    const segmentEntry = Date.now();

    // Create a readable stream from your customers array
    const readableStream = new Readable({
      read() {
        customers.forEach((customerId) => {
          this.push(
            `${segmentID}\t${customerId}\t${workspace.id}\t${segmentEntry}\n`
          );
        });
        this.push(null); // No more data
      },
    });

    const stream = client.query(
      copyFrom.from(
        `COPY segment_customer ("segmentId", "customerId", "workspace", "segmentEntry") FROM STDIN WITH (FORMAT text)`
      )
    );

    // Error handling
    stream.on('error', (error) => {
      this.error(error, this.addBulk.name, session, account.email);
      throw error;
    });
    stream.on('finish', () => {
      this.debug(
        `Finished creating journey location rows for ${segmentID}`,
        this.addBulk.name,
        session,
        account.email
      );
    });

    // Pipe the readable stream to the COPY command
    readableStream.pipe(stream);
  }

  /**
   * Returns a number indicating the number of customers enrolled in a segment
   * 
   * @param {Account} account Account associated with this customer/segment pair
   * @param {string | Segment} segment Either the segment UUID or Segment object
   * @param {string }session HTTP session identifier
   * @param {QueryRunner} [queryRunner] Optional query runner for transactions
   * @returns {Promise<number>} A promise resolving to a number, indicating the
   * number of customers enrolled in a segment.
   */
  async getSegmentSize(
    account: Account,
    segment: Segment,
    session: string,
    queryRunner?: QueryRunner
  ): Promise<number> {

    let repository: Repository<SegmentCustomers>;
    if (queryRunner) repository = queryRunner.manager.getRepository(SegmentCustomers);
    else repository = this.segmentCustomersRepository;

    const query: FindManyOptions<SegmentCustomers> = {
      where: {
        workspace_id: account.teams?.[0]?.organization?.workspaces?.[0].id,
        segment_id: segment.id,
      },
    };
    let count: number = await repository.count(query);
    return count;
  }


  async getSegmentsForCustomer(
    account: Account,
    customerUUID: string,
    take = 100,
    skip = 0,
    search = '',
    session: string,
    queryRunner?: QueryRunner
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const customer = await this.customersService.getCustomerByUUID(customerUUID, workspace.id);

    // need to find all segments the customer is in
    const totalPages = await this.segmentCustomersRepository.count({
      where: {
        customer_id: customer.id,
        workspace_id: workspace.id
      }
    });

    const result = await this.segmentCustomersRepository.find({
      select: {
        segment_id: true
      },
      where: {
        customer_id: customer.id,
        workspace_id: workspace.id
      },
      take: take < 100 ? take : 100,
      skip: skip,
      order: {
        segment_id: "ASC"
      }
    });

    const segmentIds = result.map(x => x.segment_id)

    const segments = await this.segmentRepository.find({
      where: {
        id: In(segmentIds)
      }
    });

    return { data: segments, totalPages };
  }

  /**
   * 
   * 
   * @param {Account} account Account associated with this customer/segment pair
   * @param {string | Segment} segment Either the segment UUID or Segment object
   * @param {string }session HTTP session identifier
   * @param {QueryRunner} [queryRunner] Optional query runner for transactions
   * @returns 
   */
  async getCustomersInSegment(
    account: Account,
    segment: string | Segment,
    session: string,
    queryRunner?: QueryRunner
  ) {

  }

  /**
   * Returns a boolean value indicating whether or not the specified customer is
   * in the specified segment.
   * 
   * @param {Account} account Account associated with this customer/segment pair
   * @param {string} segment UUID
   * @param {string } customer id
   * @param {string }session HTTP session identifier
   * @param {QueryRunner} [queryRunner] Optional query runner for transactions
   * @returns {Promise<boolean>} A promise resolving to a boolean, indicating whether or not
   * the specified customer was found in the specified segment. Uses a findOne query under
   * the hood.
   */
  async isCustomerInSegment(
    workspaceId: string,
    segmentId: string,
    customerId: string
  ): Promise<boolean> {
    const found: boolean = await this.segmentCustomersRepository.exist({
      where: {
        workspace_id: workspaceId,
        segment_id: segmentId,
        customer_id: customerId,
      }
    });

    return found;
  }
}
