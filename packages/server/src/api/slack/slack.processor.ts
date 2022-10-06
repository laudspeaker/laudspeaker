import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject, Injectable } from '@nestjs/common';
import { WebClient } from '@slack/web-api';

@Processor('slack')
@Injectable()
export class SlackProcessor {
  client: WebClient;

  constructor() {
    this.client = new WebClient();
  }

  @Process('send')
  async handleSend(job: Job) {
    try {
      await this.client.apiCall(job.data.methodName, {
        token: job.data.token,
        ...job.data.args,
      });
    } catch (e) {
      console.log(e);
    }
  }
}
