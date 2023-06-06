import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from '../customers/customers.service';
import { AudiencesService } from './audiences.service';
import { Audience } from './entities/audience.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Workflow } from '../workflows/entities/workflow.entity';
import { createMock } from '@golevelup/ts-jest';
import { TemplatesService } from '../templates/templates.service';
import { Repository } from 'typeorm';
import { JobsService } from '../jobs/jobs.service';

describe('AudiencesService', () => {
  let service: AudiencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudiencesService,
        {
          provide: CustomersService,
          useValue: createMock<CustomersService>(),
        },
        {
          provide: TemplatesService,
          useValue: createMock<TemplatesService>(),
        },
        {
          provide: JobsService,
          useValue: createMock<JobsService>(),
        },
        {
          provide: getRepositoryToken(Audience),
          useClass: Repository
        },
        {
          provide: getRepositoryToken(Workflow),
          useClass: Repository
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
      ],
    }).compile();

    service = module.get<AudiencesService>(AudiencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
