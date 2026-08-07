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
import { Server, Socket } from 'socket.io';
import { AccountsService } from '../api/accounts/accounts.service';
import { Account } from '../api/accounts/entities/accounts.entity';
import { CustomersService } from '../api/customers/customers.service';
import { EventsService } from '../api/events/events.service';
import { WebhooksService } from '../api/webhooks/webhooks.service';
import { JourneysService } from '../api/journeys/journeys.service';
import { RavenInterceptor } from 'nest-raven';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
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
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooksService: WebhooksService,
  ) { }

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
    return;
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

  @SubscribeMessage('ping')
  public async handlePing(@ConnectedSocket() socket: Socket) {
    socket.emit('log', 'pong');
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
    return false;
  }

  @SubscribeMessage('moveToNode')
  public async moveToNode(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    nodeId: string
  ) {
    return;
  }
}
