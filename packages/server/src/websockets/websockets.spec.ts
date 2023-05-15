import { AccountsService } from '../api/accounts/accounts.service';
import { CustomersService } from '../api/customers/customers.service';
import { EventsService } from '../api/events/events.service';
import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from './websocket.gateway';
import { cloneDeep } from 'lodash';

let mockDatabase: any = [];

const mockCustomerModel = {
  findOne: jest.fn((criteria) =>
    mockDatabase.find((item) =>
      Object.keys(criteria).every(
        (key) => item.hasOwnProperty(key) && item[key] === criteria[key]
      )
    )
  ),
  create: jest.fn((params) => {
    const id = Math.random() * 100;
    const el = { _id: id, id, ...params };
    mockDatabase.push(el);
    return el;
  }),
  findByIdAndUpdate: jest.fn((id: string, params: Object) => {
    const i = mockDatabase.findIndex((item) => item.id === id);
    if (i === -1) return undefined;
    mockDatabase[i] = {
      id,
      ...params,
    };

    return mockDatabase[i];
  }),
  watch: jest.fn().mockReturnValue({
    on: jest.fn(),
  }),
};

const mockAccountService = {
  findOneByAPIKey: jest.fn(),
};

jest.mock('../api/accounts/accounts.service', () => ({
  AccountsService: jest.fn().mockImplementation(() => ({
    ...mockAccountService,
  })),
}));

const defaultMockSocket = {
  emit: jest.fn(),
  disconnect: jest.fn(),
  handshake: {
    auth: {
      apiKey: 'ownerAPI',
      customerId: '',
    },
  },
  data: {
    account: { id: 'ownerId' },
    customerId: 'customerId',
  },
};

let mockSocket = cloneDeep(defaultMockSocket);

jest.mock('../api/customers/customers.service', () => ({
  CustomersService: jest.fn().mockImplementation(() => ({
    CustomerModel: mockCustomerModel,
    deleteEverywhere: jest.fn(),
  })),
}));

const mockEventService = {
  enginePayload: jest.fn(),
};

jest.mock('../api/events/events.service', () => ({
  EventsService: jest.fn().mockImplementation(() => ({
    ...mockEventService,
  })),
}));

describe('WebsocketGateway', () => {
  let wsGw: WebsocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        AccountsService,
        CustomersService,
        EventsService,
      ],
    }).compile();

    wsGw = module.get<WebsocketGateway>(WebsocketGateway);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockDatabase = [];
    mockSocket = cloneDeep(defaultMockSocket);
  });

  test('on connection if account not found by API key socket should be disconnected', async () => {
    await wsGw.handleConnection(mockSocket as any);

    expect(mockAccountService.findOneByAPIKey).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('error', 'Bad API key');
    expect(mockSocket.disconnect).toHaveBeenLastCalledWith(true);
  });

  test('on connection if account was found and customer id is not valid it creates new anonymous customer and set it to socket data', async () => {
    mockCustomerModel.create({
      id: '1',
      _id: '1',
      email: 'customer@email.com',
      name: 'customer',
      ownerId: 'ownerId',
      isAnonymous: true,
      isFreezed: false,
    });

    jest
      .spyOn(mockAccountService, 'findOneByAPIKey')
      .mockImplementationOnce(() => ({
        id: 'ownerId',
      }));

    await wsGw.handleConnection(mockSocket as any);

    expect(mockAccountService.findOneByAPIKey).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'log',
      'Customer id not found. Creating new anonymous customer...'
    );
    expect(mockCustomerModel.create).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'customerId',
      mockDatabase[1].id
    );
    expect(mockSocket.emit).toHaveBeenLastCalledWith('log', 'Connected');
    expect(mockSocket.data.customerId).toEqual(mockDatabase[1].id);
    expect(mockDatabase[1].isAnonymous).toEqual(true);
  });

  test('on connection if account was found and customer id is valid and found socket data should be updated', async () => {
    mockCustomerModel.create({
      id: '645d0bbe8ec485d3aaf8a508',
      _id: '645d0bbe8ec485d3aaf8a508',
      email: 'validCustomer@email.com',
      name: 'validCustomer',
      ownerId: 'ownerId',
      isAnonymous: true,
      isFreezed: false,
    });

    mockSocket.handshake.auth.customerId = '645d0bbe8ec485d3aaf8a508';

    jest
      .spyOn(mockAccountService, 'findOneByAPIKey')
      .mockImplementationOnce(() => ({
        id: 'ownerId',
      }));

    await wsGw.handleConnection(mockSocket as any);

    expect(mockAccountService.findOneByAPIKey).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'customerId',
      mockDatabase[0].id
    );
    expect(mockSocket.emit).toHaveBeenLastCalledWith('log', 'Connected');
    expect(mockSocket.data.customerId).toEqual(mockDatabase[0].id);
    expect(mockDatabase[0].isAnonymous).toEqual(true);
  });

  test('on connection if account was found and customer id is valid but not found new anonymous customer should be created and socket data should be updated', async () => {
    mockSocket.handshake.auth.customerId = '645d0bbe8ec485d3aaf8a508';

    jest
      .spyOn(mockAccountService, 'findOneByAPIKey')
      .mockImplementationOnce(() => ({
        id: 'accountOwnerId',
      }));

    await wsGw.handleConnection(mockSocket as any);

    expect(mockAccountService.findOneByAPIKey).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'error',
      'Invalid customer id. Creating new anonymous customer...'
    );
    expect(mockDatabase[0].isAnonymous).toEqual(true);
    expect(mockDatabase[0].ownerId).toEqual('accountOwnerId');
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'customerId',
      mockDatabase[0].id
    );
    expect(mockSocket.emit).toHaveBeenLastCalledWith('log', 'Connected');
    expect(mockSocket.data.customerId).toEqual(mockDatabase[0].id);
  });

  test('when customer not exist identify should create new customer, identify it and update with props', async () => {
    await wsGw.handleIdentify(mockSocket as any, {
      uniqueProperties: {
        email: 'test@email.com',
      },
      optionalProperties: {
        name: 'tester',
      },
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'error',
      'Invalid customer id. Creating new anonymous customer...'
    );
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'customerId',
      mockDatabase[0].id
    );
    expect(mockDatabase[0]).toHaveProperty('email', 'test@email.com');
    expect(mockDatabase[0]).toHaveProperty('name', 'tester');
    expect(mockSocket.emit).lastCalledWith('log', 'Identified');
  });

  test('when anonymous customer exist identify should identify customer', async () => {
    mockCustomerModel.create({
      email: 'anonymousCustomer@email.com',
      name: 'anonymousCustomer',
      ownerId: 'ownerId',
      isAnonymous: true,
      isFreezed: false,
    });

    mockCustomerModel.create({
      email: 'existingCustomer@email.com',
      name: 'existingCustomer',
      ownerId: 'ownerId',
      isAnonymous: false,
      isFreezed: false,
    });

    // set anonymous customer from mocked array to first search expect that socket use anonymous user
    jest
      .spyOn(mockCustomerModel, 'findOne')
      .mockImplementationOnce(() => mockDatabase[0]);

    await wsGw.handleIdentify(mockSocket as any, {
      uniqueProperties: {
        email: 'existingCustomer@email.com',
      },
      optionalProperties: {
        name: 'updated',
      },
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'customerId',
      mockDatabase[1].id
    );
    expect(mockSocket.data).toHaveProperty('customerId', mockDatabase[1].id);
    expect(mockSocket.emit).lastCalledWith('log', 'Identified');
  });

  test('if user using identify with identified customer should emit error and finish', async () => {
    mockCustomerModel.create({
      email: 'existingCustomer@email.com',
      name: 'existingCustomer',
      ownerId: 'ownerId',
      isAnonymous: false,
      isFreezed: false,
    });

    jest
      .spyOn(mockCustomerModel, 'findOne')
      .mockImplementationOnce(() => mockDatabase[0]);

    await wsGw.handleIdentify(mockSocket as any, {
      uniqueProperties: {
        email: 'existingCustomer@email.com',
      },
      optionalProperties: {
        name: 'updated',
      },
    });

    expect(mockSocket.emit).lastCalledWith(
      'error',
      'Failed to identify: already identified'
    );
  });

  test('on fire if customer not found should create anonymous customer set him in socket data and hit engine payload and socket should emit worklfowTick', async () => {
    jest
      .spyOn(mockEventService, 'enginePayload')
      .mockImplementationOnce(() => 'workflowTickId');

    await wsGw.handleFire(mockSocket as any, { someKey: 'someValue' });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'error',
      'Invalid customer id. Creating new anonymous customer...'
    );
    expect(mockDatabase[0].isAnonymous).toEqual(true);
    expect(mockDatabase[0].ownerId).toEqual('ownerId');
    expect(mockSocket.data.customerId).toEqual(mockDatabase[0].id);
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'customerId',
      mockDatabase[0].id
    );
    expect(mockEventService.enginePayload).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('log', 'Successful fire');
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'workflowTick',
      'workflowTickId'
    );
  });

  test('on fire if customer found in socket data,engine payload should be hit and socket should emit worklfowTick', async () => {
    mockCustomerModel.create({
      email: 'customer@email.com',
      name: 'customer',
      ownerId: 'ownerId',
      isAnonymous: false,
      isFreezed: false,
    });

    jest
      .spyOn(mockEventService, 'enginePayload')
      .mockImplementationOnce(() => 'workflowTickId');

    await wsGw.handleFire(mockSocket as any, { someKey: 'someValue' });

    expect(mockEventService.enginePayload).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('log', 'Successful fire');
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'workflowTick',
      'workflowTickId'
    );
  });
});
