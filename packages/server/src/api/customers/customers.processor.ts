import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject } from '@nestjs/common';
import { CustomersService } from './customers.service';
import axios from 'axios';

@Processor('customers')
export class CustomersProcessor {
  constructor(
    @Inject(CustomersService) private customersService: CustomersService
  ) {}

  @Process()
  async handleSync(job: Job) {
    try {
      let res = await axios({
        method: 'get',
        url: job.data.url + '?limit=1000',
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
      console.log("processing is over");
    } catch (e) {
      console.log(e);
    }
  }
}
