import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  Customer,
  CustomerDocument,
} from './api/customers/schemas/customer.schema';
import FormData from 'form-data';
import { getType } from 'tst-reflect';
import {
  CustomerKeys,
  CustomerKeysDocument,
} from './api/customers/schemas/customer-keys.schema';
import { isDateString, isEmail } from 'class-validator';
import Mailgun from 'mailgun.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './api/accounts/entities/accounts.entity';
import { Repository } from 'typeorm';

const BATCH_SIZE = 500;
const KEYS_TO_SKIP = ['__v', '_id', 'audiences', 'ownerId'];

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerKeys.name)
    private customerKeysModel: Model<CustomerKeysDocument>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCustomerKeysCron() {
    this.logger.log('Cron customer keys job started');
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
      `Cron customer keys job finished, checked ${documentsCount} records, found ${
        Object.keys(keys).length
      } keys`
    );
  }

  private lastEventFetch?: string = new Date('2020-10-10').toUTCString();

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleClickHouseCron() {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });

    const stats: Record<string, Record<string, number>> = {};

    const accountsNumber = await this.accountRepository.count();
    let offset = 0;

    while (offset < accountsNumber) {
      const accountsBatch = await this.accountRepository.find({
        take: BATCH_SIZE,
        skip: offset,
      });

      for (const account of accountsBatch) {
        try {
          let events = await mg.events.get(account.sendingDomain, {
            begin: this.lastEventFetch,
            ascending: 'yes',
          });

          for (const item of events.items) {
            const { audienceId } = item['user-variables'];
            if (!audienceId) continue;
            if (!stats[audienceId]) stats[audienceId] = {};
            stats[audienceId][item.event] = stats[audienceId][item.event]
              ? 1
              : stats[audienceId][item.event] + 1;
          }

          let page = events.pages.next.number;
          let lastEventTimestamp =
            events.items[events.items.length - 1].timestamp * 1000;

          while (new Date(lastEventTimestamp) > new Date(this.lastEventFetch)) {
            events = await mg.events.get(account.sendingDomain, {
              begin: this.lastEventFetch,
              ascending: 'yes',
              page,
            });

            for (const item of events.items) {
              const { audienceId } = item['user-variables'];
              if (!audienceId) continue;
              if (!stats[audienceId]) stats[audienceId] = {};
              if (!stats[audienceId][item.event]) {
                stats[audienceId][item.event] = 0;
              }

              stats[audienceId][item.event]++;
            }

            lastEventTimestamp =
              events.items[events.items.length - 1].timestamp * 1000;

            page = events.pages.next.number;
          }
        } catch (e) {
          this.logger.error(e);
        }
      }
      offset += BATCH_SIZE;
      console.log(stats);
    }

    // console.dir(
    //   events,
    //   // await mg.stats.getAccount({ event: ['opened', 'delivered', 'failed'] }),
    //   {
    //     depth: null,
    //   }
    // );

    // console.log('------');
    // console.log(await mg.stats.getAccount({ event: 'clicked' }));
    // console.log('------');
    // console.log(await mg.stats.getAccount({ event: 'delivered' }));
  }
}
