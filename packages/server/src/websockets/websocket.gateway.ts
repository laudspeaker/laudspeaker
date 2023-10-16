import { Template } from '../api/templates/entities/template.entity';
import { forwardRef, Inject, UseInterceptors } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { createHash, randomUUID } from 'crypto';
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
import { RavenInterceptor } from 'nest-raven';

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

@UseInterceptors(new RavenInterceptor())
@WebSocketGateway({
  cors: true,
})
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
      socket.emit('log', 'Connection procedure initiated.');

      const account = await this.accountsService.findOneByAPIKey(apiKey);

      if (!account) {
        socket.emit('error', 'Bad API key');
        socket.disconnect(true);
        return;
      }

      socket.data.account = account;
      socket.data.session = randomUUID();

      let customer: CustomerDocument;

      // Check if given customer ID is a valid format.
      if (customerId && isValidObjectId(customerId)) {
        // Check if customer ID corresponds to an actual customer
        customer = await this.customersService.CustomerModel.findById(
          customerId
        );

        if (
          !customer ||
          customer.isFreezed ||
          customer.ownerId !== account.id
        ) {
          socket.emit(
            'log',
            'Customer id is not valid. Creating new anonymous customer.'
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
          socket.data.customerId = customer.id;
          socket.emit('customerId', customer.id);
        } else {
          socket.emit(
            'log',
            'Customer id is valid. Retrieving component states.'
          );
          socket.data.customerId = customer.id;
          socket.emit('customerId', customer.id);
          await this.syncCustomData(socket, account, customer);
        }
      } else {
        socket.emit(
          'log',
          'Customer id is not valid. Creating new anonymous customer.'
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
        socket.data.customerId = customer.id;
        socket.emit('customerId', customer.id);
      }
      socket.emit('log', 'Connection procedure complete.');

      await this.accountsService.accountsRepository.save({
        id: account.id,
        javascriptSnippetSetupped: true,
      });
    } catch (e) {
      socket.emit('error', e);
    }
  }

  public async syncCustomData(
    socket: Socket,
    account: Account,
    customer: CustomerDocument
  ) {
    if (!customer.customComponents) return;

    for (const [key, value] of Object.entries(customer.customComponents)) {
      //1.Map fields
      const data = customer.customComponents[key];

      for (const field of (data?.fields || []) as {
        name: string;
        type: string;
        defaultValue: string;
      }[]) {
        const serializer: (value: unknown) => unknown =
          fieldSerializerMap[field.type] || ((value: unknown) => value);

        data[field.name] = serializer(data[field.name]);
      }

      //2. Emit data to frontend
      socket.emit('custom', {
        show: !customer.customComponents[key].hidden,
        trackerId: key,
        ...customer.customComponents[key],
      });

      //3. Update customer object to indicate that this state has been delivered
      await this.customerModel
        .findByIdAndUpdate(customer.id, {
          $set: {
            [`customComponents.${key}`]: {
              ...customer.customComponents[key],
              delivered: true,
            },
          },
        })
        .exec();

      //4. If first time delivered, record in clickhouse
      if (!customer.customComponents[key].delivered)
        await this.webhooksService.insertClickHouseMessages([
          {
            stepId: customer.customComponents[key].step,
            createdAt: new Date().toUTCString(),
            customerId: customer.id,
            event: 'delivered',
            eventProvider: ClickHouseEventProvider.TRACKER,
            messageId: key,
            templateId: customer.customComponents[key].template,
            userId: account.id,
            processed: true,
          },
        ]);
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
    if (!socket.data?.account || !socket.data?.customerId) {
      return;
    }
    const { account, customerId } = socket.data as SocketData;

    let customer = await this.customersService.CustomerModel.findOne({
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
        ownerId: account.id,
      });

    if (identifiedCustomer) {
      await this.customersService.deleteEverywhere(customer.id);

      await this.customersService.CustomerModel.findByIdAndUpdate(customer.id, {
        isFreezed: true,
      });

      socket.data.customerId = identifiedCustomer.id;
      socket.emit('customerId', identifiedCustomer.id);

      await this.syncCustomData(socket, account, identifiedCustomer);
    } else {
      await this.customersService.CustomerModel.findByIdAndUpdate(customer.id, {
        ...customer,
        ...optionalProperties,
        ...uniqueProperties,
        ownerId: account.id,
        isAnonymous: false,
      });
    }

    socket.emit('log', 'Identified');
  }

  /**
   * Handler for custom componenet events
   * @param socket Socket event is coming from
   * @param event Object of the form {event:String,trackerId:String}
   */
  @SubscribeMessage('custom')
  public async handleCustom(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    event: { [key: string]: unknown }
  ) {
    try {
      const {
        account: { id: ownerId },
        customerId,
      } = socket.data as SocketData;

      let err = false;
      socket.emit('log', 'CustomerID:' + JSON.stringify(customerId));

      const customer = await this.customersService.CustomerModel.findById(
        customerId
      );

      socket.emit('log', 'Found customer:' + JSON.stringify(customer));

      // They have the wrong customer ID, their initial connection failed and needs to
      // be retried.
      if (!customer || customer.ownerId !== ownerId) {
        socket.emit(
          'error',
          'Customer does not exist. Please reconnect to generate a new customer ID.'
        );
        err = true;
        //Customer is frozen.
      } else if (customer.isFreezed) {
        socket.emit(
          'error',
          'Customer is frozen and cannot accept any new events.'
        );
        err = true;
      }

      const trackerId = event.trackerId;
      const eventString = event.event;

      if (!trackerId) {
        socket.emit('error', 'Invalid component ID.');
        err = true;
      }
      if (!eventString) {
        socket.emit('error', 'Invalid event.');
        err = true;
      }

      if (err) {
        socket.emit(
          'processedEvent',
          this.getHash(customerId, trackerId, eventString)
        );
        return;
      }

      await this.eventsService.customPayload(
        socket.data.account,
        {
          correlationKey: '_id',
          correlationValue: customer.id,
          source: 'tracker',
          event: eventString,
          payload: { trackerId },
        },
        socket.data.session
      );

      socket.emit(
        'log',
        `Received event ${event.event} for component ${event.trackerId}.`
      );
    } catch (e) {
      socket.emit('error', e);
    }
  }

  /**
   * Confirm with frontend that event has been processed.
   * This is here because frontend rate limits how many of
   * the same events a customer can send.
   *
   * @param customerId customer to send processed info to
   * @param hash hash of processed event
   * @returns boolean indicating if customer received confirmation
   */
  public async sendProcessed(
    customerID: string,
    eventString: string,
    trackerID: string
  ): Promise<boolean> {
    const sockets = await this.server.fetchSockets();

    const customerSocket = sockets.find(
      (socket) => socket.data.customerId === customerID
    );

    if (!customerSocket) return false;

    customerSocket.emit(
      'processedEvent',
      this.getHash(customerID, trackerID, eventString)
    );
    customerSocket.emit(
      'log',
      `Processed event ${eventString} for component ${trackerID}.`
    );
    customerSocket.emit(
      'log',
      `Processed event ${this.getHash(customerID, trackerID, eventString)}.`
    );

    return true;
  }

  /**
   * If socket is connected, sends state of specified
   * tracker to customer for frontend to render.
   * @param customerID Customer to send the state to.
   * @param trackerID ID of the tracker that needs updating
   * @param data Data to update with
   * @returns boolean indicating if state successfully reached customer
   */
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
    // delete data.hidden;
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

  /**
   * Generates SHA256 hash of event+trackerID+customerID
   * @param customerID
   * @param trackerID
   * @param eventString
   * @returns
   */
  private getHash(customerID: any, trackerID: any, eventString: any): string {
    return Buffer.from(
      createHash('sha256')
        .update(
          String((eventString as string) + (trackerID as string) + customerID)
        )
        .digest('hex')
    ).toString('base64');
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
}
