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
import { isValidObjectId, Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { AccountsService } from '../api/accounts/accounts.service';
import { Account } from '../api/accounts/entities/accounts.entity';
import { CustomersService } from '../api/customers/customers.service';
import { EventsService } from '../api/events/events.service';
import {
  ClickHouseEventProvider,
  WebhooksService,
} from '@/api/webhooks/webhooks.service';
import {
  Customer,
  CustomerDocument,
} from '@/api/customers/schemas/customer.schema';
import { InjectModel } from '@nestjs/mongoose';

interface SocketData {
  account: Account;
  customerId: string;
}

const fieldSerializerMap = {
  Number,
  String,
  Date: String,
  Email: String,
};

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
    private eventsService: EventsService,
    @Inject(WebhooksService) private readonly webhooksService: WebhooksService,
    @InjectModel(Customer.name) public customerModel: Model<CustomerDocument>
  ) {}

  public async handleConnection(socket: Socket) {
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
        customComponents?: any;
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

        await this.eventsService.customPayload(
          socket.data.account,
          {
            correlationKey: '_id',
            correlationValue: customer.id,
            source: 'tracker',
            event: '',
            payload: { trackerId: '' },
          },
          socket.data.session
        );
      }

      socket.data.customerId = customer.id;
      socket.emit('customerId', customer.id);
      socket.emit('log', 'Connected');
      if (customer.customComponents) {
        for (const [key, value] of Object.entries(customer.customComponents)) {
          //1. Extract visibility from custom component JSON on customer
          const show = !customer.customComponents[key].hidden;
          //2. Track state of custom component to save for later
          const toSave = {
            hidden: !customer.customComponents[key].hidden,
            delivered: true,
            ...customer.customComponents[key],
          };
          //3. Remove hidden key so it doesnt reach frontend
          delete customer.customComponents[key].hidden;
          const data = customer.customComponents[key];

          //4.Map fields
          for (const field of (data?.fields || []) as {
            name: string;
            type: string;
            defaultValue: string;
          }[]) {
            const serializer: (value: unknown) => unknown =
              fieldSerializerMap[field.type] || ((value: unknown) => value);

            data[field.name] = serializer(data[field.name]);
          }

          // 5. Emit data to frontend
          socket.emit('custom', {
            show,
            trackerId: key,
            ...customer.customComponents[key],
          });

          //6. Update customer object to indicate that this state has been delivered
          await this.customerModel
            .findByIdAndUpdate(customer.id, {
              $set: { [`customComponents.${key}`]: { ...toSave } },
            })
            .exec();

          //7. If first time delivered, record in clickhouse
          if (!customer.customComponents[key].delivered)
            await this.webhooksService.insertClickHouseMessages([
              {
                stepId: toSave.step,
                createdAt: new Date().toUTCString(),
                customerId: customer.id,
                event: 'delivered',
                eventProvider: ClickHouseEventProvider.TRACKER,
                messageId: key,
                templateId: toSave.template,
                userId: account.id,
                processed: true,
              },
            ]);
        }
      }

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

      await this.eventsService.customPayload(
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
    } catch (e) {
      socket.emit('error', e);
    }
  }

  @SubscribeMessage('custom')
  public async handleCustom(
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

      const trackerId = event.trackerId;

      await this.eventsService.customPayload(
        socket.data.account,
        {
          correlationKey: '_id',
          correlationValue: customer.id,
          source: 'tracker',
          event: event.event,
          payload: { trackerId },
        },
        socket.data.session
      );

      // socket.emit('log', 'Successful fire');
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

  public async sendCustomComponentState(
    customerID: string,
    trackerID: string,
    data: Record<string, any>
  ): Promise<boolean> {
    for (const field of (data?.fields || []) as {
      name: string;
      type: string;
      defaultValue: string;
    }[]) {
      const serializer: (value: unknown) => unknown =
        fieldSerializerMap[field.type] || ((value: unknown) => value);

      data[field.name] = serializer(data[field.name]);
    }

    const show = !data.hidden;
    delete data.hidden;
    const sockets = await this.server.fetchSockets();
    for (const socket of sockets) {
      if (socket.data.customerId === customerID) {
        socket.emit('custom', {
          show,
          trackerId: trackerID,
          ...data,
        });
        return true;
      }
    }

    return false;
  }
}
