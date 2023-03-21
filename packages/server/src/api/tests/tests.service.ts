import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { DataSource, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { AuthService } from '../auth/auth.service';
import { Recovery } from '../auth/entities/recovery.entity';
import { CustomersService } from '../customers/customers.service';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import {
  CustomerKeys,
  CustomerKeysDocument,
} from '../customers/schemas/customer-keys.schema';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';
import { Installation } from '../slack/entities/installation.entity';
import { Template } from '../templates/entities/template.entity';
import { Workflow } from '../workflows/entities/workflow.entity';

@Injectable()
export class TestsService {
  constructor(
    private dataSource: DataSource,
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
    @InjectRepository(Installation)
    private installationRepository: Repository<Installation>,
    @InjectRepository(Recovery)
    private recoveryRepository: Repository<Recovery>,
    @Inject(AuthService)
    private readonly authService: AuthService,
    @InjectModel(CustomerKeys.name)
    private CustomerKeysModel: Model<CustomerKeysDocument>,
    @InjectRepository(SegmentCustomers)
    private segmentCustomersRepository: Repository<SegmentCustomers>
  ) {}

  async posthogsynctest(user: Express.User) {
    const account = await this.accountService.findOne(user);

    await this.customersService.ingestPosthogPersons(
      process.env.TESTS_POSTHOG_PROJECT_ID,
      process.env.TESTS_POSTHOG_API_KEY,
      process.env.TESTS_POSTHOG_HOST_URL,
      account
    );
  }

  async resetTestData() {
    if (process.env.NODE_ENV !== 'development')
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    try {
      await this.authService.verificationRepository.delete({
        email: 'john.smith@gmail.com',
      });

      await this.accountService.accountsRepository.delete({
        email: 'john.smith@gmail.com',
      });

      await this.authService.verificationRepository.delete({
        account: { id: '00000000-0000-0000-0000-000000000000' },
      });

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
      user.sendingDomain = process.env.MAILGUN_DOMAIN;
      user.mailgunAPIKey = process.env.MAILGUN_API_KEY;
      user.expectedOnboarding = ['Slack'];
      user.currentOnboarding = ['Slack'];
      user.emailProvider = 'mailgun';
      user.onboarded = true;
      user.smsAccountSid = process.env.TESTS_SMS_SID;
      user.smsAuthToken = process.env.TESTS_SMS_AUTH_TOKEN;
      user.smsFrom = process.env.TESTS_SMS_FROM;

      const ret = await this.authService.repository.save(user);
      await this.authService.repository.update(
        { id: ret.id },
        {
          id: '00000000-0000-0000-0000-000000000000',
        }
      );
      ret.id = '00000000-0000-0000-0000-000000000000';

      await this.workflowsRepository.delete({
        owner: { id: '00000000-0000-0000-0000-000000000000' },
      });
      await this.templateRepository.delete({
        owner: { id: '00000000-0000-0000-0000-000000000000' },
      });
      await this.audienceRepository.delete({
        owner: { id: '00000000-0000-0000-0000-000000000000' },
      });

      await this.authService.helper.generateDefaultData(
        ret,
        this.dataSource.manager
      );

      await this.customersService.CustomerModel.deleteMany({
        ownerId: '00000000-0000-0000-0000-000000000000',
      });

      const exists = await this.CustomerKeysModel.findOne({
        key: 'slackRealName',
        type: 'String',
        isArray: false,
        ownerId: '00000000-0000-0000-0000-000000000000',
      }).exec();

      if (!exists)
        await this.CustomerKeysModel.create({
          key: 'slackRealName',
          type: 'String',
          isArray: false,
          ownerId: '00000000-0000-0000-0000-000000000000',
        });

      const sanitizedMember = new CreateCustomerDto();

      sanitizedMember.slackName = 'mahamad';
      sanitizedMember.slackId = 'U04323JCL5A'; // for test purpose change it to your UID here and on the frontend -> cypress/fixture/credentials.json -> slackUid
      sanitizedMember.slackRealName = 'Mahamad Charawi';
      sanitizedMember.slackTeamId = ['T01U4FFQ796'];
      sanitizedMember.slackTimeZone = -25200;
      // sanitizedMember.slackEmail = 'mahamad@trytachyon.com';
      sanitizedMember.email = process.env.SENDING_TO_TEST_EMAIL;
      sanitizedMember.slackDeleted = false;
      sanitizedMember.slackAdmin = true;
      sanitizedMember.slackTeamMember = true;
      sanitizedMember.phone = process.env.TESTS_SMS_TO;

      await this.customersService.create(ret, sanitizedMember);

      const installationId = process.env.TESTS_INSTALLATION_ID;
      const installationJson =
        process.env.TESTS_INSTALLATION_JSON_PART1 +
        process.env.TESTS_INSTALLATION_JSON_PART2;
      if (installationId && installationJson) {
        const foundInstallation = await this.installationRepository.findOneBy({
          id: installationId,
        });
        console.log(installationJson);
        if (!foundInstallation)
          await this.installationRepository.insert({
            id: installationId,
            installation: JSON.parse(installationJson),
          });
      }
    } catch (error) {
      console.error('Error generating test users:', error);
    }
  }

  public async getTestVerification() {
    const verification = await this.authService.verificationRepository.findOne({
      where: {
        email: 'testmail@gmail.com',
        status: 'sent',
      },
      relations: ['account'],
    });
    return {
      ...verification,
      account: undefined,
      accountId: String(verification.account.id),
    };
  }

  public async updateTestAccount(data: Record<string, any>) {
    const account = await this.accountService.accountsRepository.findOneBy({
      email: 'testmail@gmail.com',
    });

    await this.accountService.accountsRepository.update(
      {
        email: 'testmail@gmail.com',
      },
      { ...account, ...data }
    );
  }

  public async verifyTestAccount(id: string) {
    const account = await this.accountService.accountsRepository.findOneBy({
      email: 'testmail@gmail.com',
    });

    await this.authService.verifyEmail(account, id);
  }

  public async getTestPosthogCustomer(id: string) {
    return this.customersService.CustomerModel.findOne({
      posthogId: [id],
    }).exec();
  }

  public async getTestCustomerId() {
    const customer = await this.customersService.CustomerModel.findOne({
      ownerId: '00000000-0000-0000-0000-000000000000',
      email: 'testmail@gmail.com',
    });
    return customer.id;
  }

  public async getAnyTestCustomerId() {
    const customer = await this.customersService.CustomerModel.findOne({
      ownerId: '00000000-0000-0000-0000-000000000000',
    });
    return customer.id;
  }

  public async getAudienceByCustomerId(id: string) {
    const audiences = await this.audienceRepository.findBy({
      owner: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'testmail@gmail.com',
      },
    });

    return audiences.find((audience) => audience.customers.includes(id));
  }

  public async getTestRecovery() {
    return this.recoveryRepository.findOneBy({
      account: { id: '00000000-0000-0000-0000-000000000000' },
    });
  }

  public async isCustomerInSegment(customerId: string) {
    const cust = await this.segmentCustomersRepository.findOne({
      where: {
        customerId,
      },
    });
    return !!cust?.id;
  }

  public async getSegmentSize(segmentId: string) {
    return await this.segmentCustomersRepository.count({
      where: {
        segment: {
          id: segmentId,
        },
      },
    });
  }

  public async getWorkflowCustomersAmount(workflowId: string) {
    const sum = await this.workflowsRepository.query(
      'select sum(array_length(audience."customers",1)) from audience where audience."workflowId" = $1',
      [workflowId]
    );

    return sum?.[0]?.sum || 0;
  }
}
