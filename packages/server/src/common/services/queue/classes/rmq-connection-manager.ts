import { RMQConnection } from './rmq-connection';
import { RMQChannel } from './rmq-channel';
import { Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

export class RMQConnectionManager {

	private _connection: RMQConnection;
	private _channel: RMQChannel;
  @Inject(WINSTON_MODULE_NEST_PROVIDER)
  private logger: Logger;

	constructor(connection: RMQConnection, channel: RMQChannel) {
		this._connection = connection;
		this._channel = channel;
	}

  static async createConnectionAndChannel(connectionTag: string) {
    const connection = new RMQConnection(connectionTag);
    await connection.init();

    const channel = new RMQChannel(connection);
    await channel.init();

    return new RMQConnectionManager(connection, channel);
  }

  get channel() {
    return this._channel;
  }

  get connection() {
    return this._connection;
  }

  get channelObj() {
    return this.channel.channel;
  }

  get connectionObj() {
    return this.connection.connection;
  }

	async close(): Promise<void> {
    // this.logger.verbose("Closing RMQConnectionManager");

    const closePromise = Promise.resolve()
      .finally( () => this.channel.close() )
      .finally( () => this.connection.close() );

    return closePromise;
	}
}