import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { LoggerService, Injectable, Inject } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Processor('slack')
@Injectable()
export class SlackProcessor {
  client: WebClient;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
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
      this.logger.error('Error: ' + e);
    }
  }
}
