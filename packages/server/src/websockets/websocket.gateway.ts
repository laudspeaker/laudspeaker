import {
  PushPlatforms,
  Template,
} from '../api/templates/entities/template.entity';
import {
  forwardRef,
  Inject,
  LoggerService,
  UseInterceptors,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  WsException,
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
import { Types } from 'mongoose';
import { JourneysService } from '@/api/journeys/journeys.service';
import { DevModeService } from '@/api/dev-mode/dev-mode.service';
import { RavenInterceptor } from 'nest-raven';
import { AnalyticsProviderTypes } from '@/api/steps/types/step.interface';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  CustomerKeys,
  CustomerKeysDocument,
} from '@/api/customers/schemas/customer-keys.schema';

interface SocketData {
  account: Account & { apiKey: string };
  customerId: string;
  development?: boolean;
  relatedDevConnection?: string;
  relatedClientDevConnection?: string;
  devJourney?: string;
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
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject(forwardRef(() => AccountsService))
    private accountsService: AccountsService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService,
    @Inject(forwardRef(() => JourneysService))
    private journeyService: JourneysService,
    @Inject(forwardRef(() => DevModeService))
    private devModeService: DevModeService,
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooksService: WebhooksService,
    @InjectModel(Customer.name) public customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerKeys.name)
    public CustomerKeysModel: Model<CustomerKeysDocument>
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: WebsocketGateway.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: WebsocketGateway.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: WebsocketGateway.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: WebsocketGateway.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: WebsocketGateway.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  public async handleConnection(socket: Socket) {
    //console.log("In handle connection socket");
    const session = randomUUID();
    try {
      const { apiKey, customerId, userId, journeyId, development } =
        socket.handshake.auth;
      socket.emit('log', 'Connection procedure initiated.');
      const account =
        development && userId && !apiKey
          ? await this.accountsService.findOne(
              {
                id: userId,
              },
              ''
            )
          : await this.accountsService.findOneByAPIKey(apiKey);

      if (!account) {
        //console.log("no account found");
        this.log('no account found', this.handleConnection.name, session);
        socket.emit('error', 'Bad API key');
        socket.disconnect(true);
        return;
      }

      socket.data.account = account;
      socket.data.session = session;
      socket.data.development = development;

      let customer: CustomerDocument;
      //console.log("socket looking for customer");
      const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

      // Check if given customer ID is a valid format.
      if (customerId && isValidObjectId(customerId) && !development) {
        // Check if customer ID corresponds to an actual customer
        customer = await this.customersService.CustomerModel.findById(
          customerId
        );

        if (
          !customer ||
          customer.isFreezed ||
          customer.workspaceId !== workspace.id
        ) {
          socket.emit(
            'log',
            'Customer id is not valid. Creating new anonymous customer.'
          );
          //console.log("In handle connection socket - creating customer");
          customer = await this.customersService.CustomerModel.create({
            isAnonymous: true,
            workspaceId: workspace.id,
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
      } else if (!development) {
        socket.emit(
          'log',
          'Customer id is not valid. Creating new anonymous customer.'
        );
        customer = await this.customersService.CustomerModel.create({
          isAnonymous: true,
          workspaceId: workspace.id,
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
      } else if (apiKey && development) {
        // User connect with devmode from his side
        socket.emit('log', 'Development mode connection');
        const id = new Types.ObjectId();

        socket.data.customerId = id;
        socket.emit('customerId', id);

        const fetchedSockets = await this.server.fetchSockets();

        const relatedSocket = fetchedSockets.find(
          (el) =>
            el.data.account?.teams?.[0]?.organization?.workspaces?.[0]
              ?.apiKey === socket.handshake.auth.apiKey &&
            el.data.relatedDevConnection
        );

        if (relatedSocket) {
          relatedSocket.data.relatedDevConnection = socket.id;
          socket.data.relatedClientDevConnection = relatedSocket.id;

          const devMode = await this.devModeService.getDevModeState(
            account.id,
            relatedSocket.handshake.auth.journeyId
          );
          if (devMode) {
            for (const key in devMode.devModeState.customerData
              .customComponents) {
              socket.emit('custom', {
                trackerId: key,
                ...devMode.devModeState.customerData.customComponents[key],
              });
            }
          }
          relatedSocket.emit('devModeReconnected');
        }
      } else if (
        !apiKey &&
        development &&
        userId &&
        journeyId &&
        process.env.WS_ORIGIN_VERIFY === socket.handshake.headers.origin
      ) {
        // User try to make connection for dev mode setup from our client
        socket.emit('log', 'Checking if dev environment is connected.');

        const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

        const journey = await this.journeyService.journeysRepository.findOne({
          where: {
            id: journeyId,
            workspace: {
              id: workspace.id,
            },
          },
        });

        if (!journey) {
          throw new WsException(
            "You don't have permission to start this journey."
          );
        }

        const sockets = await this.server.fetchSockets();
        const socketsLocal = sockets.find(
          (el) =>
            el.data?.account?.id === account.id &&
            el.id !== socket.id &&
            el.data.development === development
        );
        if (!socketsLocal) {
          throw new WsException('Dev environment not connected');
        }

        socket.data.relatedDevConnection = socketsLocal.id;
        socketsLocal.data.relatedClientDevConnection = socket.id;
        socket.data.devJourney = journey.id;

        const devMode = await this.devModeService.resetDevMode(
          account,
          journeyId
        );

        for (const key in devMode.devModeState.customerData.customComponents) {
          socketsLocal.emit('custom', {
            trackerId: key,
            ...devMode.devModeState.customerData.customComponents[key],
          });
        }
        socket.emit('devModeConnected', devMode.devModeState.customerIn.nodeId);
      } else {
        socket.emit('error', 'Unknown connection type');
        socket.disconnect(true);
        return;
      }
      socket.emit('log', 'Connection procedure complete.');

      await this.accountsService.accountsRepository.save({
        id: account.id,
        javascriptSnippetSetupped: true,
      });
    } catch (e) {
      socket.emit('error', e);
      console.error(e);
      if (e instanceof WsException) {
        socket._error(e);
      }
    }
  }

  public async handleDisconnect(socket: Socket) {
    if (socket.data.development && socket.handshake.auth.apiKey) {
      const sockets = await this.server.fetchSockets();
      const socketToClose = sockets.find(
        (el) => el.data?.relatedDevConnection === socket.id
      );
      socketToClose?.emit('devModeNeedReconnection');
    }
  }

  public async syncCustomData(
    socket: Socket,
    account: Account,
    customer: CustomerDocument
  ) {
    if (!customer.customComponents) return;

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
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
        await this.webhooksService.insertMessageStatusToClickhouse(
          [
            {
              stepId: customer.customComponents[key].step,
              createdAt: new Date().toISOString(),
              customerId: customer.id,
              event: 'delivered',
              eventProvider: ClickHouseEventProvider.TRACKER,
              messageId: key,
              templateId: customer.customComponents[key].template,
              workspaceId: workspace.id,
              processed: true,
            },
          ],
          randomUUID()
        );
    }
  }

  @SubscribeMessage('ping')
  public async handlePing(@ConnectedSocket() socket: Socket) {
    socket.emit('log', 'pong');
  }

  @SubscribeMessage('set')
  public async set(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    {
      optionalProperties,
    }: {
      optionalProperties?: { [key: string]: unknown };
    }
  ) {
    if (!socket.data?.account || !socket.data?.customerId) {
      return;
    }
    const { account, customerId } = socket.data as SocketData;

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    let customer = await this.customersService.CustomerModel.findOne({
      _id: customerId,
      workspaceId: workspace.id,
    });

    if (!customer || customer.isFreezed || customer.isAnonymous) {
      socket.emit('error', 'Invalid customer id. Please call identify first');
      return;
    }

    await this.customersService.CustomerModel.findByIdAndUpdate(customer.id, {
      ...customer.toObject(),
      ...optionalProperties,
      workspaceId: workspace.id,
    });
  }

  @SubscribeMessage('identify')
  public async handleIdentify(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    {
      //uniqueProperties,
      __PrimaryKey,
      optionalProperties,
    }: {
      //uniqueProperties: { [key: string]: unknown };
      __PrimaryKey: string;
      optionalProperties?: { [key: string]: unknown };
    }
  ) {
    //if (!uniqueProperties) throw new WsException('No uniqueProperties given');
    if (!__PrimaryKey) throw new WsException('No Primary Key given');

    if (!socket.data?.account || !socket.data?.customerId) {
      return;
    }
    const { account, customerId } = socket.data as SocketData;

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    let customer = await this.customersService.CustomerModel.findOne({
      _id: customerId,
      workspaceId: workspace.id,
    });

    if (!customer || customer.isFreezed) {
      socket.emit(
        'error',
        'Invalid customer id. Creating new anonymous customer...'
      );
      customer = await this.customersService.CustomerModel.create({
        isAnonymous: true,
        workspaceId: workspace.id,
      });

      socket.data.customerId = customer.id;
      socket.emit('customerId', customer.id);
    }

    if (!customer.isAnonymous) {
      socket.emit('error', 'Failed to identify: already identified');
      return;
    }

    const primaryKey = await this.CustomerKeysModel.findOne({
      workspaceId: workspace.id,
      isPrimary: true,
    });

    const identifiedCustomer =
      await this.customersService.CustomerModel.findOne({
        //...uniqueProperties,
        workspaceId: workspace.id,
        [primaryKey.key]: __PrimaryKey,
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
        ...customer.toObject(),
        ...optionalProperties,
        //...uniqueProperties,
        [primaryKey.key]: __PrimaryKey,
        workspaceId: workspace.id,
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
        account: { teams },
        customerId,
        development,
      } = socket.data as SocketData;

      let err = false;
      socket.emit('log', 'CustomerID:' + JSON.stringify(customerId));

      if (development) {
        const sockets = await this.server.fetchSockets();
        const socketClient = sockets.find(
          (el) => el.id === socket.data.relatedClientDevConnection
        );
        await this.devModeService.reactOnCustom(socketClient, socket, event);
        socket.emit(
          'processedEvent',
          this.getHash(customerId, event.trackerId, event.event)
        );
        return;
      }

      const customer = await this.customersService.CustomerModel.findById(
        customerId
      );

      socket.emit('log', 'Found customer:' + JSON.stringify(customer));

      const workspace = teams?.[0]?.organization?.workspaces?.[0];

      // They have the wrong customer ID, their initial connection failed and needs to
      // be retried.
      if (!customer || customer.workspaceId !== workspace.id) {
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
      socket.emit(
        'processedEvent',
        this.getHash(socket.data.customerId, event.trackerId, event.event)
      );
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
        account: { teams },
        customerId,
      } = socket.data as SocketData;

      const workspace = teams?.[0]?.organization?.workspaces?.[0];

      let customer = await this.customersService.CustomerModel.findOne({
        _id: customerId,
        workspaceId: workspace.id,
      });

      if (!customer || customer.isFreezed) {
        socket.emit(
          'error',
          'Invalid customer id. Creating new anonymous customer...'
        );
        customer = await this.customersService.CustomerModel.create({
          isAnonymous: true,
          workspaceId: workspace.id,
        });

        socket.data.customerId = customer.id;
        socket.emit('customerId', customer.id);
      }

      await this.eventsService.customPayload(
        socket.data.account,
        {
          correlationKey: '_id',
          correlationValue: customer.id,
          source: AnalyticsProviderTypes.TRACKER,
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

  @SubscribeMessage('moveToNode')
  public async moveToNode(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    nodeId: string
  ) {
    try {
      if (socket.data.processingDev)
        throw new WsException('Processing another dev option please wait');

      socket.data.processingDev = true;

      await this.devModeService.moveToNode(
        socket.data.account,
        socket.data.devJourney,
        nodeId
      );
      const devMode = await this.devModeService.getDevModeState(
        socket.data.account.id,
        socket.data.devJourney
      );

      const localSocket = this.server.sockets.sockets.get(
        socket.data.relatedDevConnection
      );

      for (const key in devMode.devModeState.customerData.customComponents) {
        localSocket.emit('custom', {
          trackerId: key,
          ...devMode.devModeState.customerData.customComponents[key],
        });
      }

      socket.emit('nodeMovedTo', nodeId);
    } catch (error) {
      if (error instanceof WsException) socket.emit('moveError', error.message);
    } finally {
      socket.data.processingDev = false;
    }
  }

  @SubscribeMessage('fcm_token')
  public async getFCMToken(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    {
      type,
      token,
    }: {
      type: PushPlatforms;
      token: string;
    }
  ) {
    if (!type) throw new WsException('No type given');
    if (!token) throw new WsException('No FCM token given');

    const {
      account: { teams },
      customerId,
    } = socket.data as SocketData;

    const workspace = teams?.[0]?.organization?.workspaces?.[0];

    let customer = await this.customersService.CustomerModel.findOne({
      _id: customerId,
      workspaceId: workspace.id,
    });

    if (!customer || customer.isFreezed) {
      socket.emit(
        'error',
        'Invalid customer id. Creating new anonymous customer...'
      );
      customer = await this.customersService.CustomerModel.create({
        isAnonymous: true,
        workspaceId: workspace.id,
      });

      socket.data.customerId = customer.id;
      socket.emit('customerId', customer.id);
    }

    await this.customersService.CustomerModel.updateOne(
      { _id: customerId },
      {
        [type === PushPlatforms.ANDROID
          ? 'androidDeviceToken'
          : 'iosDeviceToken']: token,
      }
    );
  }
}
