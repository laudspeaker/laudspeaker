import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccountsService } from './api/accounts/accounts.service';
import { Account } from './api/accounts/entities/accounts.entity';
import { CookiesService } from './api/cookies/cookies.service';
import { CustomersService } from './api/customers/customers.service';

@WebSocketGateway({ cors: true })
export class WebsocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(
    private accountsService: AccountsService,
    private customersService: CustomersService,
    private cookiesService: CookiesService
  ) {}

  public async handleConnection(socket: Socket) {
    const apiKey = socket.handshake.auth.apiKey;

    const account = await this.accountsService.findOneByAPIKey(apiKey);

    if (!account) {
      socket.emit('error', 'Bad API key');
      socket.disconnect(true);
      return;
    }

    socket.data.account = account;

    socket.emit('log', 'Connected');
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
    } = socket.data as { account: Account };

    let customer = await this.customersService.CustomerModel.findOne({
      ...uniqueProperties,
      ownerId,
    }).exec();

    if (customer) {
      await this.customersService.CustomerModel.updateOne(
        { ...uniqueProperties, ownerId },
        { ...optionalProperties, ...uniqueProperties, ownerId }
      ).exec();
    } else {
      customer = await this.customersService.CustomerModel.create({
        ...optionalProperties,
        ...uniqueProperties,
        ownerId,
      });
    }

    const cookieId = this.cookiesService.registerCookie({
      name: 'identification',
      value: customer.id,
      options: {},
    });

    socket.emit('cookie', cookieId);
  }

  @SubscribeMessage('fire')
  public async handleFire() {}
}
