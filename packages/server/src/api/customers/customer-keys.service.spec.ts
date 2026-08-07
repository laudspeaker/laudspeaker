import { Test, TestingModule } from '@nestjs/testing';
import { CustomerKeysService } from './customer-keys.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomerKey } from './entities/customer-keys.entity';
import { CacheService } from '../../common/services/cache.service';
import { CustomersService } from './customers.service';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { Account } from '../accounts/entities/accounts.entity';
import { ModifyAttributesDto, UpdateAttributeDto } from './dto/modify-attributes.dto';
import { UpdatePK_DTO } from './dto/update-pk.dto';
import { AttributeTypeName } from './entities/attribute-type.entity';

describe('CustomerKeysService', () => {
  let service: CustomerKeysService;
  let customerKeysRepository: Repository<CustomerKey>;
  let mockDataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerKeysService,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: { log: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(), verbose: jest.fn() },
        },
        {
          provide: getRepositoryToken(CustomerKey),
          useClass: Repository,
        },
        {
          provide: CacheService,
          useValue: { get: jest.fn(), set: jest.fn() },
        },
        {
          provide: CustomersService,
          useValue: { deleteAllKeys: jest.fn(), getDuplicates: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CustomerKeysService>(CustomerKeysService);
    customerKeysRepository = module.get<Repository<CustomerKey>>(getRepositoryToken(CustomerKey));
    mockDataSource = module.get<DataSource>(DataSource);
    queryRunner = await mockDataSource.createQueryRunner();
  });

  describe('getAll', () => {
    it('should return all customer keys with the correct workspace ID without queryRunner', async () => {
      const mockCustomerKeys = [
        {
          id: 1,
          name: 'Key1',
          attribute_type: { id: 1, name: 'Type1' },
          attribute_subtype: { id: 2, name: 'SubType1' },
          attribute_parameter: { id: 1, parameter: 'Parameter1' },
          is_primary: true,
          workspace: { id: 'workspaceId', name: 'Workspace1' },
        },
        {
          id: 2,
          name: 'Key2',
          attribute_type: { id: 3, name: 'Type2' },
          attribute_subtype: { id: 4, name: 'SubType2' },
          attribute_parameter: { id: 2, parameter: 'Parameter2' },
          is_primary: false,
          workspace: { id: 'wrongWorkspaceId', name: 'Workspace2' },
        },
      ] as unknown as CustomerKey[];
  
      jest.spyOn(customerKeysRepository, 'find').mockResolvedValue(
        mockCustomerKeys.filter(key => key.workspace.id === 'workspaceId')
      );
  
      const result = await service.getAll('workspaceId', 'session');
      expect(result).toEqual([
        {
          id: 1,
          name: 'Key1',
          attribute_type: { id: 1, name: 'Type1' },
          attribute_subtype: { id: 2, name: 'SubType1' },
          attribute_parameter: { id: 1, parameter: 'Parameter1' },
          is_primary: true,
          workspace: { id: 'workspaceId', name: 'Workspace1' },
        }
      ]);
      expect(customerKeysRepository.find).toHaveBeenCalledWith({
        where: {
          workspace: { id: 'workspaceId' },
        },
      });
    });
  
    it('should return all customer keys with the correct workspace ID with queryRunner', async () => {
      const mockCustomerKeys = [
        {
          id: 1,
          name: 'Key1',
          attribute_type: { id: 1, name: 'Type1' },
          attribute_subtype: { id: 2, name: 'SubType1' },
          attribute_parameter: { id: 1, parameter: 'Parameter1' },
          is_primary: true,
          workspace: { id: 'workspaceId', name: 'Workspace1' },
        },
        {
          id: 2,
          name: 'Key2',
          attribute_type: { id: 3, name: 'Type2' },
          attribute_subtype: { id: 4, name: 'SubType2' },
          attribute_parameter: { id: 2, parameter: 'Parameter2' },
          is_primary: false,
          workspace: { id: 'wrongWorkspaceId', name: 'Workspace2' },
        },
      ] as unknown as CustomerKey[];
  
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValue(
        mockCustomerKeys.filter(key => key.workspace.id === 'workspaceId')
      );
  
      const result = await service.getAll('workspaceId', 'session', queryRunner);
      expect(result).toEqual([
        {
          id: 1,
          name: 'Key1',
          attribute_type: { id: 1, name: 'Type1' },
          attribute_subtype: { id: 2, name: 'SubType1' },
          attribute_parameter: { id: 1, parameter: 'Parameter1' },
          is_primary: true,
          workspace: { id: 'workspaceId', name: 'Workspace1' },
        }
      ]);
      expect(queryRunner.manager.find).toHaveBeenCalledWith(CustomerKey, {
        where: {
          workspace: { id: 'workspaceId' },
        },
      });
    });
  });
  

  describe('createKey', () => {
    const mockAccount = { teams: [{ organization: { workspaces: [{ id: 'workspaceId' }] } }] } as Account;

    it('should throw an error if invalid attribute type is provided', async () => {
      await expect(
        service.createKey(mockAccount, 'key', 'InvalidType' as AttributeTypeName, null, 'session')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if similar key already exists', async () => {
      jest.spyOn(customerKeysRepository, 'findOne').mockResolvedValue({} as CustomerKey);

      await expect(
        service.createKey(mockAccount, 'key', AttributeTypeName.STRING, null, 'session')
      ).rejects.toThrow(HttpException);
    });

    it('should successfully create a new customer key', async () => {
      jest.spyOn(customerKeysRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(customerKeysRepository, 'save').mockResolvedValue({ id: 1 } as CustomerKey);

      const result = await service.createKey(mockAccount, 'key', AttributeTypeName.STRING, null, 'session');
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('deleteKey', () => {
    const mockAccount = { teams: [{ organization: { workspaces: [{ id: 'workspaceId' }] } }] } as Account;

    it('should throw an error if the attribute is not found', async () => {
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(null);

      await expect(service.deleteKey(mockAccount, '1', 'session', queryRunner)).rejects.toThrow(
        new HttpException('Attribute not found', 404)
      );
    });

    it('should delete the customer key and associated keys', async () => {
      const mockAttribute = { id: 1, name: 'attributeName' } as CustomerKey;
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(mockAttribute);
      jest.spyOn(service['customersService'], 'deleteAllKeys').mockResolvedValue(void 0);
      jest.spyOn(queryRunner.manager, 'delete').mockResolvedValue({ affected: 1, raw: 1 });

      await service.deleteKey(mockAccount, '1', 'session', queryRunner);

      expect(service['customersService'].deleteAllKeys).toHaveBeenCalledWith(
        'workspaceId',
        'attributeName',
        'session',
        queryRunner
      );
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(CustomerKey, { id: mockAttribute.id });
    });
  });

  describe('updateKey', () => {
    const mockAccount = { teams: [{ organization: { workspaces: [{ id: 'workspaceId' }] } }] } as Account;
    const mockUpdateAttributeDto: UpdateAttributeDto = { id: '1', key: 'updatedKey' };

    it('should throw an error if the attribute is not found', async () => {
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(null);

      await expect(service.updateKey(mockAccount, mockUpdateAttributeDto, 'session', queryRunner)).rejects.toThrow(
        new HttpException('Attribute not found', 404)
      );
    });

    it('should update the customer key', async () => {
      const mockAttributeInDb = { id: 1, name: 'oldKey', workspace: { id: 'workspaceId' } } as CustomerKey;
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(mockAttributeInDb);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue({ id: 1, name: 'updatedKey' });

      const result = await service.updateKey(mockAccount, mockUpdateAttributeDto, 'session', queryRunner);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'updatedKey' }));
    });
  });

  describe('modifyKeys', () => {
    const mockAccount = { teams: [{ organization: { workspaces: [{ id: 'workspaceId' }] } }] } as Account;
    const mockModifyAttributesDto: ModifyAttributesDto = {
      created: [{ key: 'newKey', type: AttributeTypeName.STRING, isArray: false }],
      updated: [{ id: '1', key: 'updatedKey' }],
      deleted: [{ id: '2' }]
    };

    it('should commit the transaction if no errors occur', async () => {
      jest.spyOn(service, 'createKey').mockResolvedValue({ id: 1 } as CustomerKey);
      // jest.spyOn(service, 'updateKey').mockResolvedValue({ id: 1 } as CustomerKey);
      jest.spyOn(service, 'deleteKey').mockResolvedValue(void 0);
      jest.spyOn(queryRunner, 'commitTransaction').mockResolvedValue(void 0);

      await service.modifyKeys(mockAccount, mockModifyAttributesDto, 'session');

      expect(service.createKey).toHaveBeenCalled();
      expect(service.updateKey).toHaveBeenCalled();
      expect(service.deleteKey).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback the transaction if an error occurs', async () => {
      jest.spyOn(service, 'createKey').mockRejectedValue(new Error('Test error'));
      jest.spyOn(queryRunner, 'rollbackTransaction').mockResolvedValue(void 0);

      await expect(service.modifyKeys(mockAccount, mockModifyAttributesDto, 'session')).rejects.toThrow('Test error');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('getPrimaryKey', () => {
    const mockWorkspaceId = 'workspaceId';
    const mockSession = 'session';

    it('should return the primary key without queryRunner', async () => {
      const mockPrimaryKey = { id: 1, is_primary: true } as CustomerKey;
      jest.spyOn(customerKeysRepository, 'findOne').mockResolvedValue(mockPrimaryKey);

      const result = await service.getPrimaryKey(mockWorkspaceId, mockSession);
      expect(result).toEqual(mockPrimaryKey);
      expect(customerKeysRepository.findOne).toHaveBeenCalledWith({
        where: {
          workspace: { id: mockWorkspaceId },
          is_primary: true,
        },
      });
    });

    it('should return the primary key with queryRunner', async () => {
      const mockPrimaryKey = { id: 1, is_primary: true } as CustomerKey;
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(mockPrimaryKey);

      const result = await service.getPrimaryKey(mockWorkspaceId, mockSession, queryRunner);
      expect(result).toEqual(mockPrimaryKey);
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(CustomerKey, {
        where: {
          workspace: { id: mockWorkspaceId },
          is_primary: true,
        },
      });
    });

    it('should return null if no primary key exists', async () => {
      jest.spyOn(customerKeysRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getPrimaryKey(mockWorkspaceId, mockSession);
      expect(result).toBeNull();
    });
  });

  describe('getKeyByName', () => {
    const mockKeyName = 'testKey';
    const mockWorkspaceId = 'workspaceId';
    const mockSession = 'session';

    it('should return the customer key without queryRunner', async () => {
      const mockCustomerKey = { id: 1, name: mockKeyName } as CustomerKey;
      jest.spyOn(customerKeysRepository, 'findOne').mockResolvedValue(mockCustomerKey);

      const result = await service.getKeyByName(mockKeyName, mockWorkspaceId, mockSession);
      expect(result).toEqual(mockCustomerKey);
      expect(customerKeysRepository.findOne).toHaveBeenCalledWith({
        where: {
          workspace: { id: mockWorkspaceId },
          name: mockKeyName,
        },
      });
    });

    it('should return the customer key with queryRunner', async () => {
      const mockCustomerKey = { id: 1, name: mockKeyName } as CustomerKey;
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(mockCustomerKey);

      const result = await service.getKeyByName(mockKeyName, mockWorkspaceId, mockSession, queryRunner);
      expect(result).toEqual(mockCustomerKey);
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(CustomerKey, {
        where: {
          workspace: { id: mockWorkspaceId },
          name: mockKeyName,
        },
      });
    });

    it('should return null if no key is found', async () => {
      jest.spyOn(customerKeysRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getKeyByName(mockKeyName, mockWorkspaceId, mockSession);
      expect(result).toBeNull();
    });
  });

  describe('updatePrimaryKey', () => {
    const mockAccount = { teams: [{ organization: { workspaces: [{ id: 'workspaceId' }] } }] } as Account;
    const mockUpdatePK_DTO: UpdatePK_DTO = { key: 'newPrimaryKey', type: AttributeTypeName.STRING };
    const mockSession = 'session';

    it('should throw an error if there are duplicates in the new primary key', async () => {
      jest.spyOn(service['customersService'], 'getDuplicates').mockResolvedValue(true);

      await expect(service.updatePrimaryKey(mockAccount, mockUpdatePK_DTO, mockSession)).rejects.toThrow(
        new HttpException(
          "Selected primary key can't be used because of duplicated or missing values. Primary key values must exist and be unique",
          HttpStatus.BAD_REQUEST
        )
      );
    });

    it('should throw an error if the new primary key does not exist', async () => {
      jest.spyOn(service['customersService'], 'getDuplicates').mockResolvedValue(false);
      jest.spyOn(customerKeysRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updatePrimaryKey(mockAccount, mockUpdatePK_DTO, mockSession)).rejects.toThrow(
        new HttpException(
          'Passed attribute for new PK not exist, please check again or select another one.',
          HttpStatus.BAD_REQUEST
        )
      );
    });

    it('should update the primary key if it exists and has no duplicates', async () => {
      const mockOldPK = { id: 1, is_primary: true } as CustomerKey;
      const mockNewPK = { id: 2, is_primary: false, name: 'newPrimaryKey' } as CustomerKey;

      jest.spyOn(service['customersService'], 'getDuplicates').mockResolvedValue(false);
      jest.spyOn(customerKeysRepository, 'findOne')
        .mockResolvedValueOnce(mockOldPK) // Finding old primary key
        .mockResolvedValueOnce(mockNewPK); // Finding new primary key

      jest.spyOn(customerKeysRepository, 'save').mockResolvedValue(mockNewPK);

      await service.updatePrimaryKey(mockAccount, mockUpdatePK_DTO, mockSession);

      // Check if the old primary key was deactivated
      if (mockOldPK.id !== mockNewPK.id) {
        expect(mockOldPK.is_primary).toBe(false);
        expect(customerKeysRepository.save).toHaveBeenCalledWith(mockOldPK);
      }

      // Check if the new primary key was activated
      expect(mockNewPK.is_primary).toBe(true);
      expect(customerKeysRepository.save).toHaveBeenCalledWith(mockNewPK);
    });

    it('should update the primary key with a queryRunner', async () => {
      const mockOldPK = { id: 1, is_primary: true } as CustomerKey;
      const mockNewPK = { id: 2, is_primary: false, name: 'newPrimaryKey' } as CustomerKey;

      jest.spyOn(service['customersService'], 'getDuplicates').mockResolvedValue(false);
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockOldPK) // Finding old primary key
        .mockResolvedValueOnce(mockNewPK); // Finding new primary key

      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(mockNewPK);

      await service.updatePrimaryKey(mockAccount, mockUpdatePK_DTO, mockSession, queryRunner);

      // Check if the old primary key was deactivated
      if (mockOldPK.id !== mockNewPK.id) {
        expect(mockOldPK.is_primary).toBe(false);
        expect(queryRunner.manager.save).toHaveBeenCalledWith(mockOldPK);
      }

      // Check if the new primary key was activated
      expect(mockNewPK.is_primary).toBe(true);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(mockNewPK);
    });
  });

  describe('getPossibleAttributes', () => {
    const mockAccount = { teams: [{ organization: { workspaces: [{ id: 'workspaceId' }] } }] } as Account;
    const mockSession = 'session';
    const mockKey = 'attributeKey';

    it('should return possible attributes without queryRunner', async () => {
      const mockAttributes = [
        { id: 1, name: 'attributeKey', attribute_type: { name: AttributeTypeName.STRING }, is_primary: false },
        { id: 2, name: 'attributeArrayKey', attribute_type: { name: AttributeTypeName.ARRAY }, is_primary: false }
      ];

      const expectedAttributes = [
        { id: 1, key: 'attributeKey', type: AttributeTypeName.STRING, isArray: false, isPrimary: false },
        { id: 2, key: 'attributeArrayKey', type: AttributeTypeName.ARRAY, isArray: true, isPrimary: false }
      ];

      jest.spyOn(customerKeysRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAttributes),
      } as any);

      const result = await service.getPossibleAttributes(mockAccount, mockSession, mockKey);

      expect(result).toEqual(expectedAttributes);
    });

    it('should return possible attributes with queryRunner', async () => {
      const mockAttributes = [
        { id: 1, name: 'attributeKey', attribute_type: { name: AttributeTypeName.STRING }, is_primary: false },
        { id: 2, name: 'attributeArrayKey', attribute_type: { name: AttributeTypeName.ARRAY }, is_primary: false }
      ];

      const expectedAttributes = [
        { id: 1, key: 'attributeKey', type: AttributeTypeName.STRING, isArray: false, isPrimary: false },
        { id: 2, key: 'attributeArrayKey', type: AttributeTypeName.ARRAY, isArray: true, isPrimary: false }
      ];

      jest.spyOn(queryRunner.manager, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAttributes),
      } as any);

      const result = await service.getPossibleAttributes(mockAccount, mockSession, mockKey, undefined, undefined, undefined, queryRunner);

      expect(result).toEqual(expectedAttributes);
    });

    it('should filter by type if provided', async () => {
      const mockAttributes = [
        { id: 1, name: 'attributeKey', attribute_type: { name: AttributeTypeName.STRING }, is_primary: false },
        { id: 2, name: 'attributeArrayKey', attribute_type: { name: AttributeTypeName.ARRAY }, is_primary: false }
      ];

      const expectedAttributes = [
        { id: 1, key: 'attributeKey', type: AttributeTypeName.STRING, isArray: false, isPrimary: false }
      ];

      jest.spyOn(customerKeysRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockImplementation((condition: string) => {
          if (condition === "attributeType.name = :type") {
            return jest.fn().mockReturnThis();
          }
          return jest.fn().mockReturnThis();
        }),
        getMany: jest.fn().mockResolvedValue(mockAttributes.filter(a => a.attribute_type.name === AttributeTypeName.STRING)),
      } as any);

      const result = await service.getPossibleAttributes(mockAccount, mockSession, mockKey, AttributeTypeName.STRING);

      expect(result).toEqual(expectedAttributes);
    });
  });


});
