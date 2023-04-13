import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from './entities/accounts.entity';
import { AccountsService } from './accounts.service';
import { Repository } from 'typeorm';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';

const userArray = [
  {
    firstName: 'firstName #1',
    lastName: 'lastName #1',
    email: '1@gmail.com',
  },
  {
    firstName: 'firstName #2',
    lastName: 'lastName #2',
    email: '2@gmail.com',
  },
];

const oneUser = {
  firstName: 'firstName #1',
  lastName: 'lastName #1',
  email: '1@gmail.com',
};

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: Repository<Account>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        WinstonModule.forRootAsync({
          useFactory: () => ({
            level: 'debug',
            transports: [
              new winston.transports.Console({
                handleExceptions: true,
                format: winston.format.combine(
                  winston.format.colorize(),
                  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                ),
              }),
            ],
          }),
          inject: [],
        })
      ],
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: {
            find: jest.fn().mockResolvedValue(userArray),
            findOneBy: jest.fn().mockResolvedValue(oneUser),
            save: jest.fn().mockResolvedValue(oneUser),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get<Repository<Account>>(getRepositoryToken(Account));

    await repository.save(userArray);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // describe('findOne()', () => {
  //   it('should get a single user', () => {
  //     const repoSpy = jest.spyOn(repository, 'findOneBy');
  //     expect(service.findOne("1@gmail.com")).resolves.toEqual(oneUser);
  //     expect(repoSpy).toBeCalledWith({ email: "1@gmail.com" });
  //   });
  // });

  // describe('remove()', () => {
  //   it('should call remove with the passed value', async () => {
  //     const removeSpy = jest.spyOn(repository, 'delete');
  //     const retVal = await service.remove('2@gmail.com');
  //     expect(removeSpy).toBeCalledWith('2@gmail.com');
  //     expect(retVal).toBeUndefined();
  //   });
  // });
});
