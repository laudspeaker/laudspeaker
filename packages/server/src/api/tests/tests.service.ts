import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
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
  AttributeType,
  CustomerKeys,
  CustomerKeysDocument,
} from '../customers/schemas/customer-keys.schema';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';
import { Installation } from '../slack/entities/installation.entity';
import { Template } from '../templates/entities/template.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { isThursday } from 'date-fns';
import {
  CreateAttributeDto,
  ModifyAttributesDto,
} from '../customers/dto/modify-attributes.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TestsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
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

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: TestsService.name,
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
        class: TestsService.name,
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
        class: TestsService.name,
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
        class: TestsService.name,
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
        class: TestsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async posthogsynctest(user: Express.User, session: string) {
    const account = await this.accountService.findOne(user, session);

    await this.customersService.ingestPosthogPersons(
      process.env.TESTS_POSTHOG_PROJECT_ID,
      process.env.TESTS_POSTHOG_API_KEY,
      process.env.TESTS_POSTHOG_HOST_URL,
      account,
      session
    );
  }

  async resetTestData(session: string) {
    if (process.env.NODE_ENV !== 'development')
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    if (!process.env.TEST_USER_EMAIL)
      throw new HttpException(
        'Test user email not specified',
        HttpStatus.NOT_FOUND
      );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const testAccount = await queryRunner.manager.findOne(Account, {
        where: { email: process.env.TEST_USER_EMAIL },
      });
      if (testAccount) {
        const removeResult = await queryRunner.manager.remove(
          Account,
          testAccount
        );

        this.debug(
          JSON.stringify({
            message: `Removed test user from db`,
            removeResult,
          }),
          this.resetTestData.name,
          session
        );
      }

      // TODO:  Require full rework to new structure
      // await this.authService.verificationRepository.delete({
      //   email: 'john.smith@gmail.com',
      // });
      // await this.accountService.accountsRepository.delete({
      //   email: 'john.smith@gmail.com',
      // });
      // await this.authService.verificationRepository.delete({
      //   account: { id: '00000000-0000-0000-0000-000000000000' },
      // });
      // const userCreated = await this.authService.accountRepository.findOne({
      //   where: {
      //     apiKey: 'dowkp5HD51tdEL4U09kFW2MKj3hCyT664Ol40000',
      //   },
      // });
      // if (userCreated?.id) {
      //   await this.authService.accountRepository.remove([userCreated]);
      // }
      // const user = new Account();
      // user.firstName = 'TFNameUser';
      // user.lastName = 'TLNameUser';
      // user.email = 'testmail@gmail.com';
      // user.password = this.authService.helper.encodePassword('00000000');
      // user.apiKey = 'dowkp5HD51tdEL4U09kFW2MKj3hCyT664Ol40000';
      // user.slackTeamId = ['T01U4FFQ796'];
      // user.sendingEmail = 'semail';
      // user.sendingName = 'sname';
      // user.sendingDomain = process.env.MAILGUN_DOMAIN;
      // user.mailgunAPIKey = process.env.MAILGUN_API_KEY;
      // user.expectedOnboarding = ['Slack'];
      // user.currentOnboarding = ['Slack'];
      // user.emailProvider = 'mailgun';
      // user.onboarded = true;
      // user.smsAccountSid = process.env.TESTS_SMS_SID;
      // user.smsAuthToken = process.env.TESTS_SMS_AUTH_TOKEN;
      // user.smsFrom = process.env.TESTS_SMS_FROM;
      // user.verified = true;
      // const ret = await this.authService.accountRepository.save(user);
      // await this.authService.accountRepository.update(
      //   { id: ret.id },
      //   {
      //     id: '00000000-0000-0000-0000-000000000000',
      //   }
      // );
      // ret.id = '00000000-0000-0000-0000-000000000000';
      // await this.workflowsRepository.delete({
      //   owner: { id: '00000000-0000-0000-0000-000000000000' },
      // });
      // await this.templateRepository.delete({
      //   owner: { id: '00000000-0000-0000-0000-000000000000' },
      // });
      // await this.audienceRepository.delete({
      //   owner: { id: '00000000-0000-0000-0000-000000000000' },
      // });
      // await this.authService.helper.generateDefaultData(
      //   ret,
      //   queryRunner,
      //   session
      // );
      // await this.customersService.CustomerModel.deleteMany({
      //   ownerId: '00000000-0000-0000-0000-000000000000',
      // });
      // const exists = await this.CustomerKeysModel.findOne({
      //   key: 'slackRealName',
      //   type: 'String',
      //   isArray: false,
      //   ownerId: '00000000-0000-0000-0000-000000000000',
      // }).exec();
      // if (!exists)
      //   await this.CustomerKeysModel.create({
      //     key: 'slackRealName',
      //     type: 'String',
      //     isArray: false,
      //     ownerId: '00000000-0000-0000-0000-000000000000',
      //   });
      // const sanitizedMember = new CreateCustomerDto();
      // sanitizedMember.slackName = 'mahamad';
      // sanitizedMember.slackId = 'U04323JCL5A'; // for test purpose change it to your UID here and on the frontend -> cypress/fixture/credentials.json -> slackUid
      // sanitizedMember.slackRealName = 'Mahamad Charawi';
      // sanitizedMember.slackTeamId = ['T01U4FFQ796'];
      // sanitizedMember.slackTimeZone = -25200;
      // // sanitizedMember.slackEmail = 'mahamad@trytachyon.com';
      // sanitizedMember.email = process.env.SENDING_TO_TEST_EMAIL;
      // sanitizedMember.slackDeleted = false;
      // sanitizedMember.slackAdmin = true;
      // sanitizedMember.slackTeamMember = true;
      // sanitizedMember.phone = process.env.TESTS_SMS_TO;
      // await this.customersService.create(ret, sanitizedMember, session);
      // const installationId = process.env.TESTS_INSTALLATION_ID;
      // const installationJson =
      //   process.env.TESTS_INSTALLATION_JSON_PART1 +
      //   process.env.TESTS_INSTALLATION_JSON_PART2;
      // if (installationId && installationJson) {
      //   const foundInstallation = await this.installationRepository.findOneBy({
      //     id: installationId,
      //   });
      //   if (!foundInstallation)
      //     await this.installationRepository.insert({
      //       id: installationId,
      //       installation: JSON.parse(installationJson),
      //     });
      // }
      await queryRunner.commitTransaction();
    } catch (error) {
      queryRunner.rollbackTransaction();
      this.error(error, this.resetTestData.name, session);
    } finally {
      queryRunner.release();
    }
  }

  public async seedTestAudience(account: Account) {
    const session = randomUUID();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const primaryKey: CreateAttributeDto = {
      key: 'email',
      type: AttributeType.EMAIL,
      isArray: false,
    };

    const created: CreateAttributeDto[] = [
      primaryKey,
      {
        key: 'name',
        type: AttributeType.STRING,
        isArray: false,
      },
      {
        key: 'user_id',
        type: AttributeType.STRING,
        isArray: false,
      },
      {
        key: 'is_own_car',
        type: AttributeType.BOOLEAN,
        isArray: false,
      },
      {
        key: 'is_delete',
        type: AttributeType.BOOLEAN,
        isArray: false,
      },
      {
        key: 'credit_score',
        type: AttributeType.NUMBER,
        isArray: false,
      },
      {
        key: 'recent_appl_date',
        type: AttributeType.DATE,
        isArray: false,
        dateFormat: 'yyyy-MM-dd',
      },
      {
        key: 'recent_repay_amt',
        type: AttributeType.NUMBER,
        isArray: false,
      },
      {
        key: 'androidDeviceToken',
        type: AttributeType.STRING,
        isArray: false,
      },
      {
        key: 'iosDeviceToken',
        type: AttributeType.STRING,
        isArray: false,
      },
    ];

    const modifyAttributes: ModifyAttributesDto = {
      created,
      updated: [],
      deleted: [],
    };

    await this.customersService.modifyAttributes(account, modifyAttributes);
    await this.customersService.updatePrimaryKey(account, primaryKey, session);
  }

  public async getTestVerification(email: string, session: string) {
    const verification = await this.authService.verificationRepository.findOne({
      where: {
        email,
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

  public async updateTestAccount(data: Record<string, any>, session: string) {
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

  public async verifyTestAccount(id: string, session: string) {
    const account = await this.accountService.accountsRepository.findOneBy({
      email: 'testmail@gmail.com',
    });

    await this.authService.verifyEmail(account, id, session);
  }

  public async getTestPosthogCustomer(id: string, session: string) {
    return this.customersService.CustomerModel.findOne({
      posthogId: [id],
    }).exec();
  }

  public async getTestCustomerId(session: string) {
    const customer = await this.customersService.CustomerModel.findOne({
      ownerId: '00000000-0000-0000-0000-000000000000',
      email: 'testmail@gmail.com',
    });
    return customer.id;
  }

  public async getAnyTestCustomerId(session: string) {
    const customer = await this.customersService.CustomerModel.findOne({
      ownerId: '00000000-0000-0000-0000-000000000000',
    });
    return customer.id;
  }

  public async getAudienceByCustomerId(id: string, session: string) {
    const audiences = await this.audienceRepository.findBy({
      owner: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'testmail@gmail.com',
      },
    });

    return audiences.find((audience) => audience.customers.includes(id));
  }

  public async getTestRecovery(session: string) {
    return this.recoveryRepository.findOneBy({
      account: { id: '00000000-0000-0000-0000-000000000000' },
    });
  }

  //to do
  public async isCustomerInSegment(customerId: string, session: string) {
    const cust = await this.segmentCustomersRepository.findOne({
      where: {
        customerId,
      },
    });
    return true;
    //return !!cust?.id;
  }

  public async getSegmentSize(segmentId: string, session: string) {
    return await this.segmentCustomersRepository.count({
      where: {
        segment: segmentId, //{id: segmentId,},
      },
    });
  }

  public async getWorkflowCustomersAmount(workflowId: string, session: string) {
    const sum = await this.workflowsRepository.query(
      'select sum(array_length(audience."customers",1)) from audience where audience."workflowId" = $1',
      [workflowId]
    );

    return sum?.[0]?.sum || 0;
  }
}
