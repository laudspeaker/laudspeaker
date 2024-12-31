import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicKey, Signature, Ecdsa } from 'starkbank-ecdsa';
import { Account } from '../accounts/entities/accounts.entity';
import { createHmac } from 'crypto';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common/exceptions';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import axios from 'axios';
import FormData from 'form-data';
import { randomUUID } from 'crypto';
import { Step } from '../steps/entities/step.entity';
import { EventWebhook } from '@sendgrid/eventwebhook';
import { Queue } from 'bullmq';
import { Webhook } from 'svix';
import fetch from 'node-fetch'; // Ensure you have node-fetch if you're using Node.js
import { ProviderType } from '../events/processors/events.preprocessor';
import { Organization } from '../organizations/entities/organization.entity';
import {
  DEFAULT_PLAN,
  OrganizationPlan,
} from '../organizations/entities/organization-plan.entity';
import * as Sentry from '@sentry/node';
import Stripe from 'stripe';
import { QueueType } from '../../common/services/queue/types/queue-type';
import { Producer } from '../../common/services/queue/classes/producer';
import {
  ClickHouseTable,
  ClickHouseEventProvider,
  ClickHouseMessage,
  ClickHouseClient
} from '../../common/services/clickhouse';
import { CacheService } from '../../common/services/cache.service';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { CacheConstants } from '../../common/services/cache.constants';

@Injectable()
export class WebhooksService {
  private MAILGUN_HOOKS_TO_INSTALL = [
    'clicked',
    'complained',
    'delivered',
    'opened',
    'permanent_fail',
    'temporary_fail',
    'unsubscribed',
  ];

  private sendgridEventsMap = {
    click: 'clicked',
    open: 'opened',
  };

  private stripeClient = new Stripe.Stripe(process.env.STRIPE_SECRET_KEY);

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Step)
    private stepRepository: Repository<Step>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationPlan)
    private organizationPlanRepository: Repository<OrganizationPlan>,
    @Inject(ClickHouseClient)
    private clickhouseClient: ClickHouseClient,
    @Inject(CacheService) private cacheService: CacheService,
    @InjectRepository(Workspaces) private workspacesRepository: Repository<Workspaces>,

  ) {
    const session = randomUUID();
    (async () => {
      try {
        if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_TEST_DOMAIN)
          await this.setupMailgunWebhook(
            process.env.MAILGUN_API_KEY,
            process.env.MAILGUN_TEST_DOMAIN
          );
      } catch (e) {
        this.error(e, WebhooksService.name, session);
      }
    })();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: WebhooksService.name,
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
        class: WebhooksService.name,
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
        class: WebhooksService.name,
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
        class: WebhooksService.name,
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
        class: WebhooksService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  public async processSendgridData(
    signature: string,
    timestamp: string,
    session: string,
    data?: any[]
  ) {
    let step: Step = null;

    for (const item of data) {
      if (!item.stepId) continue;

      step = await this.stepRepository.findOne({
        where: {
          id: item.stepId,
        },
        relations: ['workspace'],
      });

      if (step) break;
    }

    if (!step) return;
    const { sendgridVerificationKey } = step.workspace;

    if (!sendgridVerificationKey)
      throw new BadRequestException(
        'No sendgridVerificationKey was found to check signature'
      );

    const payload =
      data.length > 1
        ? JSON.stringify(data).split('},{').join('},\r\n{') + '\r\n'
        : JSON.stringify(data) + '\r\n';

    const ew = new EventWebhook();
    const key = ew.convertPublicKeyToECDSA(sendgridVerificationKey);
    const validSignature = ew.verifySignature(
      key,
      payload,
      signature,
      timestamp
    );

    if (!validSignature) throw new ForbiddenException('Invalid signature');

    const messagesToInsert: ClickHouseMessage[] = [];

    for (const item of data) {
      const {
        stepId,
        customerId,
        templateId,
        event,
        sg_message_id,
        timestamp,
      } = item;
      if (
        !stepId ||
        !customerId ||
        !templateId ||
        !event ||
        !sg_message_id ||
        !timestamp
      )
        continue;

      const clickHouseRecord: ClickHouseMessage = {
        workspaceId: step.workspace.id,
        stepId,
        customerId,
        templateId: String(templateId),
        messageId: sg_message_id.split('.')[0],
        event: this.sendgridEventsMap[event] || event,
        eventProvider: ClickHouseEventProvider.SENDGRID,
        processed: false,
        createdAt: new Date(),
      };

      messagesToInsert.push(clickHouseRecord);
    }
    await this.insertMessageStatusToClickhouse(messagesToInsert, session);
  }

  public async processTwilioData(
    {
      stepId,
      customerId,
      templateId,
      SmsStatus,
      MessageSid,
    }: {
      stepId: string;
      customerId: string;
      templateId: string;
      SmsStatus: string;
      MessageSid: string;
    },
    session: string
  ) {
    const step = await this.stepRepository.findOne({
      where: {
        id: stepId,
      },
      relations: ['workspace'],
    });
    const clickHouseRecord: ClickHouseMessage = {
      workspaceId: step.workspace.id,
      stepId,
      customerId,
      templateId: String(templateId),
      messageId: MessageSid,
      event: SmsStatus,
      eventProvider: ClickHouseEventProvider.TWILIO,
      processed: false,
      createdAt: new Date(),
    };
    await this.insertMessageStatusToClickhouse([clickHouseRecord], session);
  }

  public async processResendData(req: any, body: any, session: string) {
    const step = await this.stepRepository.findOne({
      where: {
        id: body.data.tags.stepId,
      },
      relations: ['workspace.resendConnections'],
    });

    const payload = req.rawBody.toString('utf8');
    const headers = req.headers;
    const webhook = new Webhook(step.workspace.resendConnections[0].signingSecret);

    try {
      const event: any = webhook.verify(payload, headers);
      const clickHouseRecord: ClickHouseMessage = {
        workspaceId: step.workspace.id,
        stepId: event.data.tags.stepId,
        customerId: event.data.tags.customerId,
        templateId: String(event.data.tags.templateId),
        messageId: event.data.email_id,
        event: event.type.replace('email.', ''),
        eventProvider: ClickHouseEventProvider.RESEND,
        processed: false,
        createdAt: new Date(),
      };
      await this.insertMessageStatusToClickhouse([clickHouseRecord], session);
    } catch (e) {
      throw new ForbiddenException(e, 'Invalid signature');
    }
  }

  public async processMailgunData(
    body: {
      signature: { token: string; timestamp: string; signature: string };
      'event-data': {
        event: string;
        message: { headers: { 'message-id': string } };
        'user-variables': {
          stepId: string;
          customerId: string;
          templateId: string;
          accountId: string;
        };
      };
    },
    session: string
  ) {
    const {
      timestamp: signatureTimestamp,
      token: signatureToken,
      signature,
    } = body.signature;

    const {
      event,
      message: {
        headers: { 'message-id': id },
      },
      'user-variables': { stepId, customerId, templateId, accountId },
    } = body['event-data'];

    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['teams.organization.workspaces'],
    });
    if (!account) throw new NotFoundException('Account not found');

    const value = signatureTimestamp + signatureToken;

    const hash = createHmac(
      'sha256',
      account?.teams?.[0]?.organization?.workspaces?.[0]?.mailgunAPIKey ||
      process.env.MAILGUN_API_KEY
    )
      .update(value)
      .digest('hex');

    if (hash !== signature) {
      throw new ForbiddenException('Invalid signature');
    }

    this.debug(
      `${JSON.stringify({ webhook: body })}`,
      this.processMailgunData.name,
      session
    );

    if (!stepId || !customerId || !templateId || !id) return;

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    const clickHouseRecord: ClickHouseMessage = {
      workspaceId: workspace.id,
      stepId,
      customerId,
      templateId: String(templateId),
      messageId: id,
      event: event,
      eventProvider: ClickHouseEventProvider.MAILGUN,
      processed: false,
      createdAt: new Date(),
    };

    this.debug(
      `${JSON.stringify({ ClickHouseMessage: clickHouseRecord })}`,
      this.processMailgunData.name,
      session
    );

    await this.insertMessageStatusToClickhouse([clickHouseRecord], session);
  }

  public async setupMailgunWebhook(
    mailgunAPIKey: string,
    sendingDomain: string
  ) {
    const base64ApiKey = Buffer.from(`api:${mailgunAPIKey}`).toString('base64');
    const headers = {
      Authorization: `Basic ${base64ApiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const updateWebhook = (type) => {
      const url = `https://api.mailgun.net/v3/domains/${sendingDomain}/webhooks/${type}`;
      return fetch(url, {
        method: 'PUT',
        headers: headers,
        body: new URLSearchParams({
          url: process.env.MAILGUN_WEBHOOK_ENDPOINT,
        }),
      })
        .then((response) =>
          response
            .json()
            .then((data) => ({ status: response.status, body: data }))
        )
        .catch((error) => ({ error }));
    };

    const updateAllWebhooks = () => {
      const updatePromises = this.MAILGUN_HOOKS_TO_INSTALL.map((type) =>
        updateWebhook(type)
      );
      Promise.allSettled(updatePromises).then((results) => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.status === 200) {
            this.log(
              `Webhook ${this.MAILGUN_HOOKS_TO_INSTALL[index]} updated successfully`,
              this.setupMailgunWebhook.name,
              randomUUID()
            );
          } else {
            this.error(
              `Failed to update webhook ${this.MAILGUN_HOOKS_TO_INSTALL[index]
              }:${JSON.stringify(result)}`,
              this.setupMailgunWebhook.name,
              randomUUID()
            );
          }
        });
      });
    };

    updateAllWebhooks();
  }

  public async insertMessageStatusToClickhouse(
    clickhouseMessages: ClickHouseMessage[],
    session: string
  ) {
    return Sentry.startSpan(
      { name: 'WebhooksService.insertMessageStatusToClickhouse' },
      async () => {
        if (clickhouseMessages?.length) {
          const jobsData = clickhouseMessages.map((element) => {
            return {
              workspaceId: element.workspaceId,
              message: element,
              session: session,
              customer: element.customerId,
              stepId: element.stepId,
            };
          });

          let workspace: Workspaces = await this.cacheService.get(
            CacheConstants.WORKSPACES,
            jobsData[0].workspaceId,
            async () => {
              return await this.workspacesRepository.findOne({
                where: { id: jobsData[0].workspaceId },
                relations: [
                  'organization.owner',
                ]
              });
            }
          );

          let step: Step = await this.cacheService.get(
            CacheConstants.STEPS,
            jobsData[0].stepId,
            async () => {
              return await this.stepRepository.findOneBy({
                id: jobsData[0].stepId
              });
            }
          );

          let account: Account = await this.cacheService.get(
            CacheConstants.ACCOUNTS,
            workspace.organization.owner.id,
            async () => {
              return await this.accountRepository.findOne({
                where: { id: workspace.organization.owner.id },
                relations: [
                  'teams.organization.workspaces',
                  'teams.organization.plan',
                  'teams.organization.workspaces.mailgunConnections.sendingOptions',
                  'teams.organization.workspaces.sendgridConnections.sendingOptions',
                  'teams.organization.workspaces.resendConnections.sendingOptions',
                  'teams.organization.workspaces.twilioConnections',
                  'teams.organization.workspaces.pushConnections',
                  'teams.organization.owner',
                ]
              });
            }
          );

          await Producer.addBulk(
            QueueType.EVENTS_PRE,
            jobsData.map((jobData) => { return { ...jobData, workspace, step, account } }),
            ProviderType.MESSAGE
          );

          await this.clickhouseClient.insertAsync({
            table: ClickHouseTable.MESSAGE_STATUS,
            values: clickhouseMessages,
            format: 'JSONEachRow',
          });
        }
      }
    );
  }

  public async processStripePayment(
    payload: Buffer,
    signature: string,
    session: string
  ): Promise<any> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;
    try {
      // Verify the event by constructing it using the Stripe library
      event = this.stripeClient.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
      );
    } catch (err) {
      // If the event is unverified, throw an error with a suggestion to retry
      //throw new HttpException('Webhook Error: Unable to verify Stripe signature.', HttpStatus.BAD_REQUEST);
    }

    try {
      // Handle the verified event type
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent: Stripe.PaymentIntent = event.data
            .object as Stripe.PaymentIntent;
          //this.handlePaymentIntentSucceeded(paymentIntent);
          break;
        case 'payment_intent.payment_failed':
          const paymentIntentFailed: Stripe.PaymentIntent = event.data
            .object as Stripe.PaymentIntent;
          //this.handlePaymentIntentFailed(paymentIntentFailed);
          break;
        // Add more handlers as necessary
        case 'checkout.session.completed':
          //console.log('this is the event we care about');
          //console.log(JSON.stringify(event,null, 2));

          //console.log('^^ is the event we care about');
          const accountId = event.data.object.metadata.accountId;
          if (!accountId) {
            this.logger.warn(
              'No accountId found in metadata for checkout.session.completed'
            );
            return;
          }
          this.debug(
            `the checkout session event is ${JSON.stringify(event, null, 2)})}`,
            this.processStripePayment.name,
            session,
            accountId
          );
          // Find the related organization using the accountId
          const organization = await this.organizationRepository.findOne({
            where: { owner: { id: accountId } },
            relations: ['plan'],
          });

          if (!organization) {
            this.logger.warn(
              `No organization found for accountId: ${accountId}`
            );
            return;
          }
          // Update the plan to subscribed and active
          const plan = organization.plan;
          plan.subscribed = true;
          plan.activePlan = true;
          await this.organizationPlanRepository.save(plan);
          this.logger.log(
            `Updated plan for organization ${organization.id} to active and subscribed`
          );
          break;
        default:
          //console.log(`Unhandled event type: ${event.type}`);
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      // Handle errors that arise during event processing
      // throw new HttpException(`Webhook Handler Error: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Return a generic response or something more specific if you prefer
    return { received: true };
  }
}
