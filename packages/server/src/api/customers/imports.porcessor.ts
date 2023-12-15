import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { Account } from '../accounts/entities/accounts.entity';
import { S3Service } from '../s3/s3.service';
import { CustomersService } from './customers.service';
import { ImportOptions } from './dto/import-customers.dto';
import * as fastcsv from 'fast-csv';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
@Processor('imports', { removeOnComplete: { age: 0, count: 0 } })
export class ImportProcessor extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(CustomersService) private customersService: CustomersService,
    @Inject(S3Service) private s3Service: S3Service,
    @InjectModel(Customer.name) public CustomerModel: Model<CustomerDocument>
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
    console.log(
      '\n\n------\n\n------\n\n------\n\n------\n\n------\n\n------\n\n------\n\n'
    );
    const { fileData, clearedMapping, account, settings, passedPK, session } =
      job.data;
    try {
      let batch = [];
      let batchPromise;
      const readPromise = new Promise<void>(async (resolve, reject) => {
        const s3CSVStream = await this.s3Service.getImportedCSVReadStream(
          fileData.fileKey
        );
        const csvStream = fastcsv
          .parse({ headers: true })
          .on('data', async (data) => {
            let isSkipped = false;
            let convertedPKValue;
            let convertedRecord = {};
            // validate file data to type convert
            Object.keys(clearedMapping).forEach((el) => {
              if (isSkipped) return;
              const columnValue = data[el];
              if (!columnValue) {
                isSkipped = true;
                return;
              }
              const convertResult = this.customersService.convertForImport(
                data[el],
                clearedMapping[el].asAttribute.type,
                el
              );
              if (convertResult.error) {
                isSkipped = true;
                return;
              }
              if (clearedMapping[el].isPrimary) {
                convertedPKValue = convertResult.converted;
              }
              convertedRecord[clearedMapping[el].asAttribute.key] =
                convertResult.converted;
            });
            if (isSkipped) {
              return;
            }
            const filteredUpdateOptions = { ...convertedRecord };
            Object.keys(clearedMapping).forEach((el) => {
              if (clearedMapping[el].doNotOverwrite) {
                delete filteredUpdateOptions[
                  clearedMapping[el].asAttribute.key
                ];
              }
              if (
                convertedRecord[clearedMapping[el].asAttribute.key] &&
                filteredUpdateOptions?.[clearedMapping?.[el].asAttribute.key]
              ) {
                delete convertedRecord[clearedMapping[el].asAttribute.key];
              }
            });
            batch.push({
              pkKeyValue: convertedPKValue,
              create: { ...convertedRecord },
              update: { ...filteredUpdateOptions },
            });
            try {
              await batchPromise;
            } catch (error) {}
            if (batch.length >= 10000) {
              batchPromise = this.processImportRecord(
                account,
                settings.importOption,
                passedPK.asAttribute.key,
                batch
              );
              batch = [];
            }
          })
          .on('end', async () => {
            try {
              await batchPromise;
            } catch (error) {}
            if (batch.length > 0) {
              batchPromise = this.processImportRecord(
                account,
                settings.importOption,
                passedPK.asAttribute.key,
                batch
              );
              batch = [];
            }
            try {
              await batchPromise;
            } catch (error) {}
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          });
        s3CSVStream.pipe(csvStream);
      });
      await readPromise;
      await this.customersService.removeImportFile(account);
    } catch (error) {
      this.error(error, 'Processing customer import', session);
      throw error;
    }
  }

  async processImportRecord(
    account: Account,
    importOption: ImportOptions,
    pkKey: string,
    data: { pkKeyValue: any; create: object; update: object }[]
  ) {
    const withoutDuplicateKeys = Array.from(
      new Set(data.map((el) => el.pkKeyValue))
    );

    const existing = (
      await this.CustomerModel.find({
        ownerId: account.id,
        [pkKey]: { $in: withoutDuplicateKeys },
      }).exec()
    ).map((el) => el.toObject()[pkKey]);

    const toCreate = withoutDuplicateKeys
      .filter((el) => !existing.includes(el))
      .map((el) => {
        return data.find((el2) => el2.pkKeyValue === el);
      })
      .map((el) => ({
        ownerId: account.id,
        [pkKey]: el.pkKeyValue,
        ...el.create,
        ...el.update,
      }));

    if (importOption === ImportOptions.NEW) {
      try {
        await this.CustomerModel.insertMany(toCreate, { ordered: false });
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
          ownerId: account.id,
          [pkKey]: el.pkKeyValue,
          ...el.update,
        }));

      const bulk = toUpdate.map((el) => ({
        updateOne: {
          filter: { [pkKey]: el.pkKeyValue, ownerId: account.id },
          update: {
            $set: {
              ...el,
            },
          },
        },
      }));

      try {
        await this.CustomerModel.insertMany(toCreate, { ordered: false });
        await this.CustomerModel.bulkWrite(bulk, {
          ordered: false,
        });
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
          ownerId: account.id,
          [pkKey]: el.pkKeyValue,
          ...el.update,
        }));

      const bulk = toUpdate.map((el) => ({
        updateOne: {
          filter: { [pkKey]: el.pkKeyValue, ownerId: account.id },
          update: {
            $set: {
              ...el,
            },
          },
        },
      }));
      try {
        await this.CustomerModel.bulkWrite(bulk, {
          ordered: false,
        });
      } catch (error) {
        this.error(
          error,
          this.processImportRecord.name,
          '',
          'User: ' + account.id
        );
      }
    }
  }
}

