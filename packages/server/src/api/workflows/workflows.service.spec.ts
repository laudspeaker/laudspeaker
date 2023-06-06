import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WorkflowsService } from './workflows.service';
import { DataSource, Repository } from 'typeorm';
import { createMock, } from '@golevelup/ts-jest';
import { AudiencesService } from '../audiences/audiences.service';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { CustomersService } from '../customers/customers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { Account } from '../accounts/entities/accounts.entity';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let repository: Repository<Workflow>;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowsService,
        {
          provide: DataSource,
          useValue: createMock<DataSource>(),
        },
        {
          provide: AudiencesHelper,
          useValue: createMock<AudiencesHelper>(),
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
          provide: AudiencesService,
          useValue: createMock<AudiencesService>(),
        },
        {
          provide: getRepositoryToken(Workflow),
          useClass: Repository,
        },
        {
          provide: CustomersService,
          useValue: createMock<CustomersService>(),
        },
        {
          provide: getModelToken('Customer'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getModelToken('EventKeys'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getConnectionToken(),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    repository = module.get<Repository<Workflow>>(getRepositoryToken(Workflow))
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  
  describe('findAll()', () => {
    it('should call with userID if present', () => {
      const acct = new Account();
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

  describe('findAllActive()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('findAllActive()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('create()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('update()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  
  describe('duplicate()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('start()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('enrollCustomer()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('tick()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('remove()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('setPaused()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('setStopped()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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


  describe('markFlowDeleted()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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

  describe('timeTick()', () => {
    it('should find all active journeys', () => {
      const acct = new Account();
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
});
