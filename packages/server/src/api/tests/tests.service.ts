import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { AuthService } from '../auth/auth.service';
import { CustomersService } from '../customers/customers.service';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { Template } from '../templates/entities/template.entity';
import { Workflow } from '../workflows/entities/workflow.entity';

@Injectable()
export class TestsService {
  constructor(
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(AccountsService)
    private accountService: AccountsService,
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    @InjectRepository(Audience)
    private audienceRepository: Repository<Audience>,
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @Inject(AuthService)
    private readonly authService: AuthService
  ) {}

  async posthogsynctest(user: Express.User) {
    if (process.env.NODE_ENV !== 'development') return;

    const account = await this.accountService.findOne(user);

    await this.customersService.ingestPosthogPersons(
      process.env.TESTS_POSTHOG_PROJECT_ID,
      process.env.TESTS_POSTHOG_API_KEY,
      process.env.TESTS_POSTHOG_HOST_URL,
      account
    );
  }

  async resetTestData() {
    if (process.env.NODE_ENV !== 'development') return;
    try {
      await this.accountService.accountsRepository.delete({
        email: 'john.smith@gmail.com',
      });

      const userCreated = await this.authService.repository.findOne({
        where: {
          apiKey: 'dowkp5HD51tdEL4U09kFW2MKj3hCyT664Ol40000',
        },
      });

      if (userCreated?.id) {
        await this.authService.repository.remove([userCreated]);
      }

      const JhonSmeeth = await this.accountService.accountsRepository.findOne({
        where: {
          email: 'john.smith@gmail.com',
          firstName: 'John',
          lastName: 'Smith',
          sendingEmail: 'SendingEmail',
          sendingName: 'SendingName',
        },
      });

      if (JhonSmeeth) {
        await this.accountService.accountsRepository.remove([JhonSmeeth]);
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
      user.mailgunAPIKey = process.env.MAILGUN_API_KEY;
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

      await this.customersService.CustomerModel.deleteMany({
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
