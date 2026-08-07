import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
const amqplib = require('amqplib');

@Injectable()
export class RMQConnection {
  public connection;
  private connectionTag: string;
  @Inject(WINSTON_MODULE_NEST_PROVIDER)
  private logger: Logger;

  @Inject('RMQ_CONFIG_OPTIONS')
  private configOptions: Record<string, any>;

  constructor(connectionTag: string) {
    this.connectionTag = connectionTag;
  }

  async init() {   
    // this.logger.verbose("RMQ: Opening Connection");

    const connectionName = this.getConnectionName();

    this.connection = await amqplib.connect(
      process.env.RMQ_CONNECTION_URI ?? 'amqp://localhost', {
        clientProperties: {
          connection_name: connectionName
        }
    });
  }

  private getConnectionName(): string {
    return `${process.env.LAUDSPEAKER_PROCESS_TYPE}-${process.pid}-${this.connectionTag}`;
  }
  
  async close() {
    // this.logger.verbose("RMQ: Closing Connection");

    return this.connection.close();
  }
}