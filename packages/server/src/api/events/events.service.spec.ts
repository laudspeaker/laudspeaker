import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock, } from '@golevelup/ts-jest';
import { EventsService } from './events.service';
import { CustomersService } from '../customers/customers.service';
import { AccountsService } from '../accounts/accounts.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { EventsTable, Eventtype, JobTypes } from './interfaces/event.interface';
import { Account } from '../accounts/entities/accounts.entity';

describe('EventsService', () => {
  let service: EventsService;
  let customersService: DeepMocked<CustomersService>;
  let messageQueue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: AccountsService,
          useValue: createMock<AccountsService>(),
        },
        {
          provide: DataSource,
          useValue: createMock<DataSource>(),
        },
        {
          provide: WorkflowsService,
          useValue: createMock<WorkflowsService>(),
        },
        {
          provide: CustomersService,
          useValue: createMock<CustomersService>(),
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: {
            log: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: getQueueToken('message'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getQueueToken('slack'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getQueueToken('events'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getQueueToken('webhooks'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getModelToken('Event'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getModelToken('PosthogEvent'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getModelToken('PosthogEventType'),
          useValue: {
            updateOne: () => {
              return { exec: jest.fn(() => { }) }
            },
          }
        },
        {
          provide: getModelToken('EventKeys'),
          useValue: {
            updateOne: () => {
              return { exec: jest.fn(() => { }) }
            },
          }
        },
        {
          provide: getConnectionToken(),
          useValue: { add: jest.fn() },
        },
      ],
    })
      .compile();

    service = module.get<EventsService>(EventsService);
    customersService = module.get(CustomersService);
    messageQueue = module.get("BullQueue_message")
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('correlate()', () => {
    it('should call with userID if present', () => {
      const acct = new Account();
      const ev: EventsTable = {
        anonymousId: "string",
        userId: "string",
        channel: "string",
        context: "string",
        event: "string",
        _type: Eventtype.track,
        messageId: "string",
        properties: {},
        originalTimestamp: new Date(),
        sentAt: new Date
      };
      const cd = new customersService.CustomerModel({ownerId: acct.id, userId: "string" })
      customersService.findByExternalIdOrCreate.mockResolvedValueOnce(cd)
      const serviceSpy = jest.spyOn(customersService, 'findByExternalIdOrCreate');
      expect(service.correlate(acct,ev)).resolves.toEqual(cd);
      expect(serviceSpy).toBeCalledWith(acct, "string");
    });

    it('should call with anonymousID if userID not present', () => {
      const serviceSpy = jest.spyOn(customersService, 'findByExternalIdOrCreate');
      expect(service.correlate("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith(acct, "string");
    });
  });

  describe('correlateCustomEvent()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });

  describe('getJobStatus()', () => {
    it('should correctly get an email jobID', () => {
      const queueSpy = jest.spyOn(messageQueue, 'getJob');
      expect(service.getJobStatus({ jobId: '1' }, JobTypes.email, "abc123")).resolves.toEqual({});
      expect(queueSpy).toBeCalledWith({ jobId: '1' });
    });

    it('should correctly get a slack jobID', () => {
      const queueSpy = jest.spyOn(messageQueue, 'getJob');
      expect(service.getJobStatus({ jobId: '1' }, JobTypes.slack, "abc123")).resolves.toEqual({});
      expect(queueSpy).toBeCalledWith({ jobId: '1' });
    });
  });

  describe('getPostHogPayload()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });

  describe('getOrUpdateAttributes()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });

  describe('getAttributes()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });

  describe('getPossibleTypes()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });

  describe('getPossibleComparisonTypes()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });

  describe('getPossibleValues()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });

  describe('getPossiblePosthogTypes()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });

  describe('getPosthogEvents()', () => {
    it('should get a single user', () => {
      const repoSpy = jest.spyOn(repository, 'findOneBy');
      expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
      expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
    });
  });
});
