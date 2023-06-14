import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { getConnectionToken } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { StepsService } from './steps.service';

describe('StepsService', () => {
  let service: StepsService;
  let transitionQueue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepsService,
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
          provide: getQueueToken('transition'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getConnectionToken(),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<StepsService>(StepsService);
    transitionQueue = module.get('BullQueue_transition');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addBulkToStart()', () => {
    it('should call addToStart with each customer in the customer array', () => {});

    it('should not throw an error if customers is null or undefined', () => {});
  });

  describe('addToStart()', () => {
    it("should add the customer to the start step's customers array", () => {});

    it('should add a job to the transition queue', () => {});

    it('should throw an error if a journey has multiple start steps', () => {});

    it('should return immediately if the customer is null or undefined', () => {});
  });

  describe('findAll()', () => {
    it('should find all the steps for a given account', () => {});
  });

  describe('findAllByType()', () => {
    it('should find all steps of type start belonging to any account', () => {});

    it('should find all steps of type start belonging to a specific account', () => {});
  });

  describe('findOne()', () => {
    it('should get a single step', () => {});
  });

  describe('insert()', () => {
    it('should create a step with no customers', () => {});

    it('should not allow a step to be added to a journey in progress', () => {});
  });

  describe('transactionalfindByJourneyID()', () => {
    it('should get all steps associated with a journey', () => {});
  });

  describe('update()', () => {
    it('should call the repository with the new values', () => {});

    it('should not allow a step from a journey in progress to be updated', () => {});
  });

  describe('delete()', () => {
    it('should delete a step', () => {});

    it('should not allow a step from a journey in progress to be deleted', () => {});
  });
});
