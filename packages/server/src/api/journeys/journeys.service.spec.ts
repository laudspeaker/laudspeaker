import { Test, TestingModule } from '@nestjs/testing';
import { createMock, } from '@golevelup/ts-jest';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { JourneysService } from './journeys.service';
import { Journey } from './entities/journey.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StepsService } from '../steps/steps.service';
import { CustomersService } from '../customers/customers.service';

describe('JourneysService', () => {
  let service: JourneysService;
  let transitionQueue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JourneysService,
        {
          provide: DataSource,
          useValue: createMock<DataSource>(),
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
            provide: StepsService,
            useValue: createMock<StepsService>(),
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
            provide: getRepositoryToken(Journey),
            useValue: {
              find: jest.fn().mockResolvedValue([]),
              findOneBy: jest.fn().mockResolvedValue([]),
              save: jest.fn().mockResolvedValue([]),
              remove: jest.fn(),
              delete: jest.fn(),
            },
          },
        {
          provide: getConnectionToken(),
          useValue: { add: jest.fn() },
        },
      ],
    })
      .compile();

    service = module.get<JourneysService>(JourneysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should call addToStart with each customer in the customer array', () => {
    });

    it('should not throw an error if customers is null or undefined', () => {
    });
  });

  describe('duplicate()', () => {
    it('should add the customer to the start step\'s customers array', () => {
    });

    it('should add a job to the transition queue', () => {
    });

    it('should throw an error if a journey has multiple start steps', () => {
    });

    it('should return immediately if the customer is null or undefined', () => {
    });
  });

  describe('enrollCustomer()', () => {
    it('should find all the steps for a given account', () => {
    });
  });

  describe('findAll()', () => {
    it('should find all steps of type start belonging to any account', () => {
    });

    it('should find all steps of type start belonging to a specific account', () => {
    });
  });

  describe('findAllActive()', () => {
    it('should get a single step', () => {
    });
  });

  describe('findOne()', () => {
    it('should create a step with no customers', () => {
    });

    it('should not allow a step to be added to a journey in progress', () => {
    });
  });

  describe('markDeleted()', () => {
    it('should get all steps associated with a journey', () => {
    });
  });

  describe('setPaused()', () => {
    it('should call the repository with the new values', () => {
    });

    it('should not allow a step from a journey in progress to be updated', () => {
    });
  });

  describe('start()', () => {
    it('should delete a step', () => {
    });

    it('should not allow a step from a journey in progress to be deleted', () => {
    });
  });

  describe('stop()', () => {
    it('should delete a step', () => {
    });

    it('should not allow a step from a journey in progress to be deleted', () => {
    });
  });

  describe('transactionalUpdate()', () => {
    it('should delete a step', () => {
    });

    it('should not allow a step from a journey in progress to be deleted', () => {
    });
  });

  describe('updatepdate()', () => {
    it('should delete a step', () => {
    });

    it('should not allow a step from a journey in progress to be deleted', () => {
    });
  });
});
