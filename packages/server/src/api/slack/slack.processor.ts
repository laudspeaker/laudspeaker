import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LoggerService, Injectable, Inject } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Liquid } from 'liquidjs';
import {
  ClickHouseEventProvider,
  WebhooksService,
} from '../webhooks/webhooks.service';

@Injectable()
@Processor('slack', { removeOnComplete: { age: 0, count: 0 } })
export class SlackProcessor extends WorkerHost {
  client: WebClient;
  tagEngine: Liquid;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webhooksService: WebhooksService
  ) {
    super();
    this.client = new WebClient();
    this.tagEngine = new Liquid();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      let textWithInsertedTags;
      const { tags, text, ...args } = job.data.args;
      try {
        if (text) {
          textWithInsertedTags = await this.tagEngine.parseAndRender(
            text,
            tags || {},
            { strictVariables: true }
          );
        }
      } catch (error) {
        this.logger.warn("Merge tag can't be used, skipping sending...");
        await this.webhooksService.insertMessageStatusToClickhouse([
          {
            userId: job.data.accountId,
            event: 'error',
            createdAt: new Date().toISOString(),
            eventProvider: ClickHouseEventProvider.SLACK,
            messageId: '',
            audienceId: job.data.args.audienceId,
            customerId: job.data.args.customerId,
            templateId: String(job.data.args.templateId),
            processed: false,
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
