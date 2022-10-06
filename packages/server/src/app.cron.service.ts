import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  Customer,
  CustomerDocument,
} from './api/customers/schemas/customer.schema';
import { getType } from 'tst-reflect';
import {
  CustomerKeys,
  CustomerKeysDocument,
} from './api/customers/schemas/customer-keys.schema';
import { isDateString, isEmail } from 'class-validator';

const BATCH_SIZE = 500;
const KEYS_TO_SKIP = ['__v', '_id', 'audiences', 'ownerId'];

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerKeys.name)
    private customerKeysModel: Model<CustomerKeysDocument>
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Cron job started');
    let current = 0;
    const documentsCount = await this.customerModel
      .estimatedDocumentCount()
      .exec();

    const keys: Record<string, any[]> = {};

    while (current < documentsCount) {
      const batch = await this.customerModel
        .find()
        .skip(current)
        .limit(BATCH_SIZE)
        .exec();

      batch.forEach((customer) => {
        const obj = customer.toObject();
        for (const key of Object.keys(obj)) {
          if (KEYS_TO_SKIP.includes(key)) continue;

          if (keys[key]) {
            keys[key].push(obj[key]);
            continue;
          }

          keys[key] = [obj[key]];
        }
      });
      current += BATCH_SIZE;
    }

    for (const key of Object.keys(keys)) {
      const validItem = keys[key].find(
        (item) => item !== '' && item !== undefined && item !== null
      );

      if (validItem === '' || validItem === undefined || validItem === null)
        continue;

      const keyType = getType(validItem);
      const isArray = keyType.isArray();
      let type = isArray ? getType(validItem[0]).name : keyType.name;

      if (type === 'String') {
        if (isEmail(validItem)) type = 'Email';
        if (isDateString(validItem)) type = 'Date';
      }

      await this.customerKeysModel
        .updateOne(
          { key },
          {
            $set: {
              key,
              type,
              isArray,
            },
          },
          { upsert: true }
        )
        .exec();
    }

    this.logger.log(
      `Cron job finished, checked ${documentsCount} records, found ${
        Object.keys(keys).length
      } keys`
    );
  }
}
