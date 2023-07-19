import { Template } from '../api/templates/entities/template.entity';
import { forwardRef, Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { isValidObjectId } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { AccountsService } from '../api/accounts/accounts.service';
import { Account } from '../api/accounts/entities/accounts.entity';
import { CustomersService } from '../api/customers/customers.service';
import { EventsService } from '../api/events/events.service';

interface SocketData {
  account: Account;
  customerId: string;
}

@WebSocketGateway({ cors: true })
export class WebsocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(
    @Inject(forwardRef(() => AccountsService))
    private accountsService: AccountsService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService
  ) {}

  public async handleConnection(socket: Socket) {
    console.log(socket.id);
    try {
      const { apiKey, customerId } = socket.handshake.auth;

      const account = await this.accountsService.findOneByAPIKey(apiKey);

      if (!account) {
        socket.emit('error', 'Bad API key');
        socket.disconnect(true);
        return;
      }

      socket.data.account = account;
      socket.data.session = randomUUID();

      let customer: {
        id?: string;
        isAnonymous?: boolean;
        isFreezed?: boolean;
      };

      if (customerId && isValidObjectId(customerId)) {
        customer = await this.customersService.CustomerModel.findOne({
          _id: customerId,
          ownerId: account.id,
        });

        if (!customer || customer.isFreezed) {
          socket.emit(
            'error',
            'Invalid customer id. Creating new anonymous customer...'
          );
          customer = await this.customersService.CustomerModel.create({
            isAnonymous: true,
            ownerId: account.id,
          });
        }
      } else {
        socket.emit(
          'log',
          'Customer id not found. Creating new anonymous customer...'
        );
        customer = await this.customersService.CustomerModel.create({
          isAnonymous: true,
          ownerId: account.id,
        });
      }

      socket.data.customerId = customer.id;
      socket.emit('customerId', customer.id);
      socket.emit('log', 'Connected');

      await this.accountsService.accountsRepository.save({
        id: account.id,
        javascriptSnippetSetupped: true,
      });
    } catch (e) {
      socket.emit('error', e);
    }
  }

  @SubscribeMessage('ping')
  public async handlePing(@ConnectedSocket() socket: Socket) {
    socket.emit('log', 'pong');
  }

  @SubscribeMessage('identify')
  public async handleIdentify(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    {
      uniqueProperties,
      optionalProperties,
    }: {
      uniqueProperties: { [key: string]: unknown };
      optionalProperties?: { [key: string]: unknown };
    }
  ) {
    const {
      account: { id: ownerId },
      customerId,
    } = socket.data as SocketData;

    let customer = await this.customersService.CustomerModel.findOne({
      _id: customerId,
      ownerId,
    });

    if (!customer || customer.isFreezed) {
      socket.emit(
        'error',
        'Invalid customer id. Creating new anonymous customer...'
      );
      customer = await this.customersService.CustomerModel.create({
        isAnonymous: true,
        ownerId,
      });

      socket.data.customerId = customer.id;
      socket.emit('customerId', customer.id);
    }

    if (!customer.isAnonymous) {
      socket.emit('error', 'Failed to identify: already identified');
      return;
    }

    const identifiedCustomer =
      await this.customersService.CustomerModel.findOne({
        ...uniqueProperties,
        ownerId,
      });

    if (identifiedCustomer) {
      await this.customersService.deleteEverywhere(customer.id);

      await this.customersService.CustomerModel.findByIdAndUpdate(customer.id, {
        isFreezed: true,
      });

      socket.data.customerId = identifiedCustomer.id;
      socket.emit('customerId', identifiedCustomer.id);
    } else {
      await this.customersService.CustomerModel.findByIdAndUpdate(customer.id, {
        ...optionalProperties,
        ...uniqueProperties,
        ownerId,
        isAnonymous: false,
      });
    }

    socket.emit('log', 'Identified');
  }

  @SubscribeMessage('fire')
  public async handleFire(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    event: { [key: string]: unknown }
  ) {
    try {
      const {
        account: { id: ownerId, apiKey },
        customerId,
      } = socket.data as SocketData;

      let customer = await this.customersService.CustomerModel.findOne({
        _id: customerId,
        ownerId,
      });

      if (!customer || customer.isFreezed) {
        socket.emit(
          'error',
          'Invalid customer id. Creating new anonymous customer...'
        );
        customer = await this.customersService.CustomerModel.create({
          isAnonymous: true,
          ownerId,
        });

        socket.data.customerId = customer.id;
        socket.emit('customerId', customer.id);
      }

      const workflowTick = await this.eventsService.customPayload(
        socket.data.account,
        {
          correlationKey: '_id',
          correlationValue: customer.id,
          source: 'custom',
          event: '',
          payload: event,
        },
        socket.data.session
      );

      socket.emit('log', 'Successful fire');
      socket.emit('workflowTick', workflowTick);
    } catch (e) {
      socket.emit('error', e);
    }
  }

  public async sendModal(
    customerId: string,
    template: Template
  ): Promise<boolean> {
    const sockets = await this.server.fetchSockets();
    for (const socket of sockets) {
      if (socket.data.customerId === customerId) {
        socket.emit('modal', template.modalState);
        return true;
      }
    }

    return false;
  }
}
