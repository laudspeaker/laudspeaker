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
import { TemplatesService } from '../templates/templates.service';

@Processor('webhooks')
@Injectable()
export class WebhooksProcessor {
  private tagEngine = new Liquid();

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webhooksService: WebhooksService,
    private readonly templatesService: TemplatesService
  ) {}

  @Process('whapicall')
  async handleWebhookTemplate(
    job: Job<{ template: Template; [key: string]: any }>
  ) {
    const { template, filteredTags } = job.data;

    const { method, retries, fallBackAction } = template.webhookData;

    let { body, headers, url } = template.webhookData;

    url = await this.tagEngine.parseAndRender(url, filteredTags || {}, {
      strictVariables: true,
    });
    url = await this.templatesService.parseTemplateTags(url);

    if (
      [
        WebhookMethod.GET,
        WebhookMethod.HEAD,
        WebhookMethod.DELETE,
        WebhookMethod.OPTIONS,
      ].includes(method)
    ) {
      body = undefined;
    } else {
      body = await this.templatesService.parseTemplateTags(body);
      body = await this.tagEngine.parseAndRender(body, filteredTags || {}, {
        strictVariables: true,
      });
    }

    headers = Object.fromEntries(
      await Promise.all(
        Object.entries(headers).map(async ([key, value]) => [
          await this.templatesService.parseTemplateTags(
            await this.tagEngine.parseAndRender(key, filteredTags || {}, {
              strictVariables: true,
            })
          ),
          await this.templatesService.parseTemplateTags(
            await this.tagEngine.parseAndRender(value, filteredTags || {}, {
              strictVariables: true,
            })
          ),
        ])
      )
    );

    let retriesCount = 0;
    let success = false;

    this.logger.debug(
      'Sending webhook requst: \n' +
        JSON.stringify(template.webhookData, null, 2)
    );
    let error: string | null = null;
    while (!success && retriesCount < retries) {
      try {
        const res = await fetch(url, {
          method,
          body,
          headers,
        });

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
        if (e instanceof Error) error = e.message;
        await wait(5000);
      }
    }

    if (!success) {
      switch (fallBackAction) {
        case FallBackAction.NOTHING:
          this.logger.error('Failed to send webhook request');
          break;
      }

      try {
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
      } catch (e) {
        this.logger.error('Failed to insert into clickhouse: ' + e);
      }

      throw new Error(error);
    } else {
      try {
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
      } catch (e) {
        this.logger.error('Failed to insert into clickhouse: ' + e);
      }
    }

    return { url, body, headers };
  }
}
