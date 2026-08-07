import { RMQConnection } from './rmq-connection';
import { Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

export class RMQChannel {
  public connection;
  public channel;
  @Inject(WINSTON_MODULE_NEST_PROVIDER)
  private logger: Logger;

  constructor(connection: RMQConnection) {
    this.connection = connection;
  }

  async init() {
    // this.logger.verbose("RMQ: Opening Channel");

    this.channel = await this.connection.connection.createChannel();
  }

  async close() {
    // this.logger.verbose("RMQ: Closing Channel");

    return this.channel.close();
  }
}