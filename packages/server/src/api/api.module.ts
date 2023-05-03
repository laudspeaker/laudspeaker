import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { CustomersModule } from './customers/customers.module';
import { EmailModule } from './email/email.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { AudiencesModule } from './audiences/audiences.module';
import { EventsModule } from './events/events.module';
import { TemplatesModule } from './templates/templates.module';
import { SlackModule } from './slack/slack.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './workflows/entities/workflow.entity';
import { Template } from './templates/entities/template.entity';
import { Audience } from './audiences/entities/audience.entity';
import { TestsModule } from './tests/tests.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SegmentsModule } from './segments/segments.module';
import { SmsModule } from './sms/sms.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { JobsModule } from './jobs/jobs.module';
import { TestsService } from './tests/tests.service';
import { FilterModule } from './filter/filter.module';
import { WebhookJob } from './webhook-jobs/entities/webhook-job.entity';
import { WebhookJobsModule } from './webhook-jobs/webhook-jobs.module';
import Accounts from 'twilio/lib/rest/Accounts';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Audience,
      Template,
      Workflow,
      WebhookJob,
      Accounts,
    ]),
    AccountsModule,
    AuthModule,
    CustomersModule,
    EmailModule,
    WorkflowsModule,
    AudiencesModule,
    EventsModule,
    TemplatesModule,
    SlackModule,
    TestsModule,
    WebhooksModule,
    SegmentsModule,
    SmsModule,
    IntegrationsModule,
    JobsModule,
    TestsModule,
    FilterModule,
    WebhookJobsModule,
  ],
})
export class ApiModule {
  constructor(private readonly testsService: TestsService) {
    if (process.env.NODE_ENV === 'development') {
      this.testsService.resetTestData(randomUUID());
    }
  }
}
