import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject } from '@nestjs/common';
import { CustomersService } from './customers.service';
import axios from 'axios';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Processor('customers')
export class CustomersProcessor {
  constructor(
    @Inject(CustomersService) private customersService: CustomersService,
    @InjectConnection() private readonly connection: mongoose.Connection
  ) {}

  @Process()
  async handleSync(job: Job) {
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();

    try {
      let res = await axios({
        method: 'get',
        url: job.data.url?.includes('localhost')
          ? 'http://'
          : 'https://' + job.data.url + '?limit=1000',
        headers: {
          Authorization: job.data.auth,
        },
      });

      if (res?.data?.results.length > 0) {
        await this.customersService.addPhCustomers(
          res.data.results,
          job.data.account,
          transactionSession
        );
      }
      while (res.data?.next) {
        res = await axios({
          method: 'get',
          url: res.data.next,
          headers: {
            Authorization: job.data.auth,
          },
        });
        if (res?.data?.results.length > 0) {
          await this.customersService.addPhCustomers(
            res.data.results,
            job.data.account,
            transactionSession
          );
        }
      }
      console.log('processing is over');
      await transactionSession.commitTransaction();
    } catch (e) {
      console.log(e);
      await transactionSession.abortTransaction();
    } finally {
      await transactionSession.endSession();
    }
  }
}
