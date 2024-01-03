/* eslint-disable no-case-declarations */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Liquid } from 'liquidjs';
import {
  ClickHouseEventProvider,
  WebhooksService,
} from '../webhooks/webhooks.service';
import { fetch } from 'undici';
import wait from '../../utils/wait';
import {
  FallBackAction,
  Template,
  WebhookMethod,
} from '../templates/entities/template.entity';
import { TemplatesService } from '../templates/templates.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Repository } from 'typeorm';

@Processor('webhooks', { removeOnComplete: { age: 0, count: 0 } })
@Injectable()
export class WebhooksProcessor extends WorkerHost {
  private tagEngine = new Liquid();

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly webhooksService: WebhooksService,
    private readonly templatesService: TemplatesService,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: WebhooksProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: WebhooksProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: WebhooksProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: WebhooksProcessor.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: WebhooksProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async process(job: Job<{ template: Template; [key: string]: any }>) {
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
    const account = await this.accountRepository.findOne({
      where: { id: job.data.accountId },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

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
        await this.webhooksService.insertMessageStatusToClickhouse([
          {
            event: 'error',
            createdAt: new Date().toISOString(),
            eventProvider: ClickHouseEventProvider.WEBHOOKS,
            messageId: '',
            audienceId: job.data.audienceId,
            customerId: job.data.customerId,
            templateId: String(job.data.template.id),
            workspaceId: workspace.id,
            processed: false,
          },
        ]);
      } catch (e) {
        this.logger.error('Failed to insert into clickhouse: ' + e);
      }

      throw new Error(error);
    } else {
      try {
        await this.webhooksService.insertMessageStatusToClickhouse([
          {
            event: 'sent',
            createdAt: new Date().toISOString(),
            eventProvider: ClickHouseEventProvider.WEBHOOKS,
            messageId: '',
            audienceId: job.data.audienceId,
            customerId: job.data.customerId,
            templateId: String(job.data.template.id),
            workspaceId: workspace.id,
            processed: false,
          },
        ]);
      } catch (e) {
        this.logger.error('Failed to insert into clickhouse: ' + e);
      }
    }

    return { url, body, headers };
  }
}
