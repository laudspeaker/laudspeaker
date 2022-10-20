import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { LoggerService, Injectable, Inject } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Liquid } from 'liquidjs';

const tagEngine = new Liquid();

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
      const { tags, text, ...args } = job.data.args;
      const textWithInsertedTags = await tagEngine.parseAndRender(
        text,
        tags || {}
      );
      await this.client.apiCall(job.data.methodName, {
        token: job.data.token,
        text: textWithInsertedTags,
        ...args,
      });
    } catch (e) {
      this.logger.error('Error: ' + e);
    }
  }
}
