import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { LoggerService, Injectable, Inject } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Liquid } from 'liquidjs';
import {
  ClickHouseEventProvider,
  WebhooksService,
} from '../webhooks/webhooks.service';

const tagEngine = new Liquid();

@Processor('slack')
@Injectable()
export class SlackProcessor {
  client: WebClient;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webhooksService: WebhooksService
  ) {
    this.client = new WebClient();
  }

  @Process('send')
  async handleSend(job: Job) {
    try {
      let textWithInsertedTags;
      const { tags, text, ...args } = job.data.args;
      try {
        if (text) {
          textWithInsertedTags = await tagEngine.parseAndRender(
            text,
            tags || {},
            { strictVariables: true }
          );
        }
      } catch (error) {
        this.logger.warn("Merge tag can't be used, skipping sending...");
        await this.webhooksService.insertClickHouseMessages([
          {
            userId: job.data.accountId,
            event: 'error',
            createdAt: new Date().toUTCString(),
            eventProvider: ClickHouseEventProvider.SLACK,
            messageId: '',
            audienceId: job.data.args.audienceId,
            customerId: job.data.args.customerId,
            templateId: String(job.data.args.templateId),
          },
        ]);
        return;
      }

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
