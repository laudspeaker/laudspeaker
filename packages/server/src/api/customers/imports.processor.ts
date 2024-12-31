import { Inject, Injectable } from '@nestjs/common';
import { Job, MetricsTime } from 'bullmq';
import { Account } from '../accounts/entities/accounts.entity';
import { S3Service } from '../s3/s3.service';
import { CustomersService } from './customers.service';
import { ImportOptions } from './dto/import-customers.dto';
import * as fastcsv from 'fast-csv';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Segment } from '../segments/entities/segment.entity';
import { Repository } from 'typeorm';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';
import { randomUUID } from 'crypto';
import { Processor } from '../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../common/services/queue/classes/processor-base';
import { Customer } from './entities/customer.entity';

@Injectable()
@Processor('imports')
export class ImportProcessor extends ProcessorBase {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(CustomersService) private customersService: CustomersService,
    @Inject(S3Service) private s3Service: S3Service,
    @InjectRepository(Segment) public segmentRepository: Repository<Segment>,
    @InjectRepository(Customer) public customersRepository: Repository<Customer>,
    @InjectRepository(SegmentCustomers)
    public segmentCustomersRepository: Repository<SegmentCustomers>
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: CustomersService.name,
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
        class: CustomersService.name,
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
        class: CustomersService.name,
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
        class: CustomersService.name,
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
        class: CustomersService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const {
      fileData,
      clearedMapping,
      account,
      settings,
      passedPK,
      segmentId,
      session,
    } = job.data;

    try {
      let batchNumber = 0;
      let batch = [];
      let promiseSet = new Set();

      const readPromise = new Promise<void>(async (resolve, reject) => {
        const s3CSVStream = await this.s3Service.getImportedCSVReadStream(
          fileData.fileKey
        );
        const csvStream = fastcsv
          .parse({ headers: true })
          .on('data', async (data) => {
            let isSkipped = false;
            let convertedPKValue;
            const convertedRecord = {};
            // validate file data to type convert
            Object.keys(clearedMapping).forEach((el) => {
              if (isSkipped) return;
              const convertResult = this.customersService.convertForImport(
                data[el],
                clearedMapping[el].asAttribute?.attribute.attribute_type.name,
                el,
                clearedMapping[el].asAttribute.dateFormat
              );
              if (convertResult.error) {
                isSkipped = true;
                return;
              }
              if (clearedMapping[el].is_primary) {
                convertedPKValue = convertResult.converted;
              }
              convertedRecord[clearedMapping[el].asAttribute?.attribute.name] =
                convertResult.converted;
            });
            if (isSkipped) {
              return;
            }
            const filteredUpdateOptions = { ...convertedRecord };
            Object.keys(clearedMapping).forEach((el) => {
              if (clearedMapping[el].doNotOverwrite) {
                delete filteredUpdateOptions[
                  clearedMapping[el].asAttribute.attribute.name
                ];
              }
              if (
                convertedRecord[clearedMapping[el].asAttribute.attribute.name] &&
                filteredUpdateOptions?.[clearedMapping?.[el].asAttribute.attribute.name]
              ) {
                delete convertedRecord[clearedMapping[el].asAttribute.attribute.name];
              }
            });
            batch.push({
              pkKeyValue: convertedPKValue,
              create: { ...convertedRecord },
              update: { ...filteredUpdateOptions },
            });
            if (batch.length >= 10000) {
              csvStream.pause();
              let batchId = randomUUID();

              this.warn(
                `Processing batch # ${batchNumber} - ${batchId}. Batch size: ${batch.length}`,
                this.process.name,
                session
              );
              promiseSet.add(batchId);
              batchNumber++;

              this.processImportRecord(
                account,
                settings.importOption,
                passedPK.asAttribute.attribute.name,
                batch,
                segmentId,
                session
              )
                .catch((error) => {
                  throw error;
                })
                .finally(() => {
                  promiseSet.delete(batchId);
                });

              batch = [];
              csvStream.resume();
            }
          })
          .on('end', async () => {
            // end() might be called while the last record of the last
            // batch is still being processed. batch array might
            // still have the records in the last batch, so we
            // need to ensure all promises have been resolved
            // before checking on the batch array
            let interval: NodeJS.Timeout | undefined = undefined;
            const checkAllBatchesCompleted = async () => {
              if (promiseSet.size === 0) {
                if (interval) clearInterval(interval);

                if (batch.length > 0) {
                  this.warn(
                    `Processing ending batch. Batch size: ${batch.length}`,
                    this.process.name,
                    session
                  );

                  await this.processImportRecord(
                    account,
                    settings.importOption,
                    passedPK.asAttribute.attribute.name,
                    batch,
                    segmentId,
                    session
                  );

                  batch = [];
                }
                resolve();
                return;
              }
            };
            interval = setInterval(checkAllBatchesCompleted, 200);

            setTimeout(() => {
              if (interval) clearInterval(interval);
              reject('Timeout while waiting for all batches to complete');
            }, 30000);
          })
          .on('error', (err) => {
            reject(err);
          });
        s3CSVStream.pipe(csvStream);
      });

      await readPromise.catch((error) => {
        throw new Error(error);
      });

      await this.customersService.removeImportFile(account);

      if (segmentId) {
        await this.segmentRepository.save({
          id: segmentId,
          isUpdating: false,
        });
      }

      this.warn(`Import complete.`, this.process.name, session);
    } catch (error) {
      this.error(error, 'Processing customer import', session);
      throw error;
    }
  }

  async processImportRecord(
    account: Account,
    importOption: ImportOptions,
    pkKey: string,
    data: { pkKeyValue: any; create: object; update: object }[],
    segmentId?: string,
    session?: string
  ) {
    this.warn(
      `Processing number of imports ${data.length}.`,
      this.processImportRecord.name,
      session
    );
    const withoutDuplicateKeys = Array.from(
      new Set(data.map((el) => el.pkKeyValue))
    );

    const organization = account?.teams?.[0]?.organization;
    const workspace = organization?.workspaces?.[0];


    const foundExisting = await this.customersRepository
      .createQueryBuilder("customer")
      .where("customer.workspace = :workspaceId", { workspaceId: workspace.id })
      .andWhere(`customer.user_attributes ->> :pkKey IN (:...keys)`, { pkKey, keys: withoutDuplicateKeys })
      .getMany();

    const existing = foundExisting.map((el) => el.user_attributes[pkKey]);

    const toCreate = withoutDuplicateKeys
      .filter((el) => !existing.includes(el))
      .map((el) => {
        return data.find((el2) => el2.pkKeyValue === el);
      })
      .map((el) => {
        const cust = new Customer();
        cust.created_at = new Date();
        cust.workspace_id = workspace.id;
        cust.user_attributes = {
          [pkKey]: el.pkKeyValue,
          ...el.create,
          ...el.update,
        }
        return cust;
      }
      );

    await this.customersService.checkCustomerLimit(
      organization,
      toCreate.length
    );

    const addToSegment = [];

    if (importOption === ImportOptions.NEW) {
      try {
        await this.customersRepository.save(toCreate);

        if (segmentId)
          for(const customer of toCreate)
            addToSegment.push(customer.id);

      } catch (error) {
        this.error(
          error,
          this.processImportRecord.name,
          '',
          'User: ' + account.id
        );
      }
    }
    if (importOption === ImportOptions.NEW_AND_EXISTING) {
      const toUpdate = withoutDuplicateKeys
        .filter((el) => existing.includes(el))
        .map((el) => {
          return data.find((el2) => el2.pkKeyValue === el);
        })
        .map((el) => ({
          workspace_id: workspace.id,
          [pkKey]: el.pkKeyValue,
          ...el.update,
        }));

      const bulk = toUpdate.map((el) => ({
        updateOne: {
          filter: { [pkKey]: el[pkKey], workspaceId: workspace.id },
          update: {
            $set: {
              ...el,
            },
          },
        },
      }));

      try {
        await this.customersRepository.save(toCreate);

        if (segmentId)
          for(const customer of toCreate)
            addToSegment.push(customer.id);

      } catch (error) {
        this.error(
          error,
          this.processImportRecord.name,
          '',
          'User: ' + account.id
        );
      }
    }
    if (importOption === ImportOptions.EXISTING) {
      const toUpdate = withoutDuplicateKeys
        .filter((el) => existing.includes(el))
        .map((el) => {
          return data.find((el2) => el2.pkKeyValue === el);
        })
        .map((el) => ({
          workspace_id: workspace.id,
          [pkKey]: el.pkKeyValue,
          ...el.update,
        }));
      const bulk = toUpdate.map((el) => ({
        updateOne: {
          filter: { [pkKey]: el[pkKey], workspaceId: account.id },
          update: {
            $set: {
              ...el,
            },
          },
        },
      }));
      try {
        // await this.CustomerModel.bulkWrite(bulk, {
        //   ordered: false,
        // });
      } catch (error) {
        this.error(
          error,
          this.processImportRecord.name,
          session,
          'User: ' + account.id
        );
      }
    }

    if (
      segmentId &&
      foundExisting.length !== 0 &&
      (importOption === ImportOptions.NEW_AND_EXISTING ||
        importOption === ImportOptions.EXISTING)
    )
      if (segmentId)
        for(const customer of foundExisting)
          addToSegment.push(customer.id);

    if (segmentId && addToSegment.length !== 0) {
      const segment = await this.segmentRepository.findOne({
        where: {
          id: segmentId,
        },
      });

      if (!segment) {
        this.error(
          `Segment ${segmentId} doesn't exist in database,
           Processing customer import -> moving to segment`,
          this.processImportRecord.name,
          session
        );
        return;
      }

      const customersToBeAdded = addToSegment.map((el) => ({
        customer_id: el,
        segment_id: segment.id,
        workspace_id: workspace.id,
      }));

      await this.segmentCustomersRepository
          .createQueryBuilder()
          .insert()
          // explicitly use the column names otherwise
          // typeorm duplicates these columns and produces
          // column specified more than once error
          .into(SegmentCustomers, ["customer_id", "segment_id", "workspace_id"])
          .values(customersToBeAdded)
          .execute();
    }
  }
}
