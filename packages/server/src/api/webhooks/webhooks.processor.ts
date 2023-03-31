/* eslint-disable no-case-declarations */
import { Process, Processor } from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Liquid } from 'liquidjs';
import {
  ClickHouseEventProvider,
  WebhooksService,
} from '../webhooks/webhooks.service';
import { fetch } from 'undici';
import wait from '@/utils/wait';
import {
  FallBackAction,
  Template,
  WebhookMethod,
} from '../templates/entities/template.entity';

@Processor('webhooks')
@Injectable()
export class WebhooksProcessor {
  private tagEngine = new Liquid();

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webhooksService: WebhooksService
  ) {}

  @Process('whapicall')
  async handleWebhookTemplate(
    job: Job<{ template: Template; [key: string]: any }>
  ) {
    console.log('123');

    const { template, filteredTags } = job.data;

    const { body, fallBackAction, headers, method, retries, url } =
      template.webhookData;

    let retriesCount = 0;
    let success = false;

    this.logger.debug(
      'Sending webhook requst: \n' +
        JSON.stringify(template.webhookData, null, 2)
    );
    while (!success && retriesCount < retries) {
      try {
        const res = await fetch(
          await this.tagEngine.parseAndRender(url, filteredTags || {}, {
            strictVariables: true,
          }),
          {
            method,
            body: [
              WebhookMethod.GET,
              WebhookMethod.HEAD,
              WebhookMethod.DELETE,
              WebhookMethod.OPTIONS,
            ].includes(method)
              ? undefined
              : await this.tagEngine.parseAndRender(body, filteredTags || {}, {
                  strictVariables: true,
                }),
            headers: Object.fromEntries(
              Object.entries(headers).map(([key, value]) => [
                this.tagEngine.parseAndRenderSync(key, filteredTags || {}, {
                  strictVariables: true,
                }),
                this.tagEngine.parseAndRenderSync(value, filteredTags || {}, {
                  strictVariables: true,
                }),
              ])
            ),
          }
        );

        if (!res.ok) throw new Error('Error sending API request');
        this.logger.debug('Successful webhook request!');
        success = true;
      } catch (e) {
        retriesCount++;
        this.logger.warn(
          'Unsuccessfull webhook request. Retries: ' +
            retriesCount +
            '. Error: ' +
            e
        );
        await wait(5000);
      }
    }

    if (!success) {
      switch (fallBackAction) {
        case FallBackAction.NOTHING:
          this.logger.error('Failed to send webhook request');
          break;
      }

      await this.webhooksService.insertClickHouseMessages([
        {
          event: 'error',
          createdAt: new Date().toUTCString(),
          eventProvider: ClickHouseEventProvider.WEBHOOKS,
          messageId: '',
          audienceId: job.data.audienceId,
          customerId: job.data.customerId,
          templateId: String(job.data.template.id),
        },
      ]);
    } else {
      await this.webhooksService.insertClickHouseMessages([
        {
          event: 'sent',
          createdAt: new Date().toUTCString(),
          eventProvider: ClickHouseEventProvider.WEBHOOKS,
          messageId: '',
          audienceId: job.data.audienceId,
          customerId: job.data.customerId,
          templateId: String(job.data.template.id),
        },
      ]);
    }
  }
}

