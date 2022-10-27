import { Inject, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { CustomersModule } from './customers/customers.module';
import { EmailModule } from './email/email.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { AudiencesModule } from './audiences/audiences.module';
import { EventsModule } from './events/events.module';
import { TemplatesModule } from './templates/templates.module';
import { SlackModule } from './slack/slack.module';
import { Account } from './accounts/entities/accounts.entity';
import { AuthService } from './auth/auth.service';
import { CustomersService } from './customers/customers.service';
import { CreateCustomerDto } from './customers/dto/create-customer.dto';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './workflows/entities/workflow.entity';
import { Repository } from 'typeorm';
import { Template } from './templates/entities/template.entity';
import { Audience } from './audiences/entities/audience.entity';
import { Installation } from './slack/entities/installation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, Template, Audience, Installation]),
    AccountsModule,
    AuthModule,
    CustomersModule,
    EmailModule,
    WorkflowsModule,
    AudiencesModule,
    EventsModule,
    TemplatesModule,
    SlackModule,
  ],
})
export class ApiModule {
  constructor(
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    @InjectRepository(Audience)
    private audienceRepository: Repository<Audience>,
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(Installation)
    private installationRepository: Repository<Installation>,
    private readonly authService: AuthService,
    private readonly customersService: CustomersService
  ) {
    if (process.env.NODE_ENV === 'development') {
      this.generateUsersForTests();
    }
  }

  /**
   * generateUsersForTests
   * generate user which will be used for testing event hitting and sending messages
   */
  private async generateUsersForTests() {
    try {
      const userCreated = await this.authService.repository.findOne({
        where: {
          apiKey: 'dowkp5HD51tdEL4U09kFW2MKj3hCyT664Ol40000',
        },
      });

      if (userCreated?.id) {
        await this.authService.repository.remove([userCreated]);
      }

      const user = new Account();

      user.firstName = 'TFNameUser';
      user.lastName = 'TLNameUser';
      user.email = 'testmail@gmail.com';
      user.password = this.authService.helper.encodePassword('00000000');
      user.apiKey = 'dowkp5HD51tdEL4U09kFW2MKj3hCyT664Ol40000';
      user.slackTeamId = ['T01U4FFQ796'];
      user.sendingEmail = 'semail';
      user.sendingName = 'sname';
      user.sendingDomain =
        'sandboxd7ae9069e24b4e8dbb5ca3ba7d4bed04.mailgun.org';
      user.mailgunAPIKey = 'e52ef0112c0c7394b273ba3d3e25474c-4dd50799-4a315eeb';
      user.expectedOnboarding = ['Slack'];
      user.currentOnboarding = ['Slack'];
      user.onboarded = true;

      const ret = await this.authService.repository.save(user);
      await this.authService.repository.update(
        { id: ret.id },
        {
          id: '1000',
        }
      );
      ret.id = '1000';

      await this.workflowsRepository.delete({ ownerId: '1000' });
      await this.templateRepository.delete({ ownerId: '1000' });
      await this.audienceRepository.delete({ ownerId: '1000' });
      await this.installationRepository.delete({ id: 'T01U4FFQ796' });

      const installation = new Installation();

      installation.id = 'T01U4FFQ796';
      installation.installation = `{
  "bot": {
    "id": "B044KLJKECR",
    "token": "xoxb-1956525823312-4145518052180-5zyhoAuKrI22UHeA2lH3DcXs",
    "scopes": [
      "app_mentions:read",
      "channels:history",
      "chat:write",
      "commands",
      "calls:read",
      "calls:write",
      "channels:read",
      "dnd:read",
      "emoji:read",
      "files:read",
      "groups:history",
      "groups:read",
      "groups:write",
      "im:history",
      "im:read",
      "im:write",
      "incoming-webhook",
      "links:read",
      "links:write",
      "mpim:history",
      "mpim:read",
      "mpim:write",
      "pins:read",
      "pins:write",
      "reactions:read",
      "reactions:write",
      "reminders:read",
      "reminders:write",
      "remote_files:read",
      "remote_files:share",
      "team:read",
      "usergroups:read",
      "usergroups:write",
      "users.profile:read",
      "users:read",
      "users:read.email",
      "users:write"
    ],
    "userId": "U0449F81J5A"
  },
  "team": {
    "id": "T01U4FFQ796",
    "name": "Tachyon"
  },
  "user": {
    "id": "U04323JCL5A"
  },
  "appId": "A04466C15FW",
  "tokenType": "bot",
  "authVersion": "v2",
  "incomingWebhook": {
    "url": "https://hooks.slack.com/services/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",
    "channel": "#laudspeaker",
    "channelId": "C03SU37838A",
    "configurationUrl": "https://tachyonspace.slack.com/services/B048K18DZ09"
  },
  "isEnterpriseInstall": false
}`;

      await this.installationRepository.save(installation);

      await this.customersService.CustomerModel.findOneAndRemove({
        ownerId: '1000',
      });

      const sanitizedMember = new CreateCustomerDto();

      sanitizedMember.slackName = 'mahamad';
      sanitizedMember.slackId = 'U04323JCL5A'; // for test purpose change it to your UID here and on the frontend -> cypress/fixture/credentials.json -> slackUid
      sanitizedMember.slackRealName = 'Mahamad Charawi';
      sanitizedMember.slackTeamId = ['T01U4FFQ796'];
      sanitizedMember.slackTimeZone = -25200;
      sanitizedMember.slackEmail = 'mahamad@trytachyon.com';
      sanitizedMember.email = process.env.SENDING_TO_TEST_EMAIL;
      sanitizedMember.slackDeleted = false;
      sanitizedMember.slackAdmin = true;
      sanitizedMember.slackTeamMember = true;

      await this.customersService.create(ret, sanitizedMember);
    } catch (error) {
      console.error('Error generating test users:', error);
    }
  }
}
