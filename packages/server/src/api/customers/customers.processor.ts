import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { CustomersService } from './customers.service';
import axios from 'axios';

@Injectable()
@Processor('customers', { removeOnComplete: { age: 0, count: 0 } })
export class CustomersProcessor extends WorkerHost {
  constructor(
    @Inject(CustomersService) private customersService: CustomersService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
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
          job.data.account
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
            job.data.account
          );
        }
      }
      console.log('processing is over');
    } catch (e) {
      console.log(e);
    }
  }
}
