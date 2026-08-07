import { RMQConnectionManager } from './rmq-connection-manager';
import { QueueType } from '../types/queue-type';
import { QueueDestination } from '../types/queue-destination';

export class QueueManager {
  private static connectionMgr: RMQConnectionManager;

  static readonly queueOptions = {
    durable: true,
    arguments: {
      maxPriority: 255
    }
  }

  static async init() {
    await this.initConnection();
    await this.initQueues();
  }

  static async assertQueue(
    queue: QueueType,
    destination: QueueDestination) {
    const channel = this.connectionMgr.channelObj;
    
    const queueName = this.getQueueName(queue, destination);
    const options = this.getQueueOptions(queue, destination);

    await channel.assertQueue(queueName, options);
  }

  static async close() {
    return this.connectionMgr.close();
  }

  static getQueueName(
    queue: QueueType,
    destination: QueueDestination): string {
    return `${queue}.${destination}`;
  }

  static getQueueOptions(
    queue: QueueType,
    destination: QueueDestination) {
    const options: Record<string, any> = {
      ...this.queueOptions
    };

    if (destination == QueueDestination.COMPLETED
      || destination == QueueDestination.FAILED) {
      options.maxLength = 500;
    }

    return options;
  }

  private static async initConnection() {
    this.connectionMgr = await RMQConnectionManager.createConnectionAndChannel('QueueManager');
  }

  private static async initQueues() {
    const allQueues = Object.values(QueueType);
    const allDestinations = Object.values(QueueDestination);

    for (const queue of allQueues) {
      for (const destination of allDestinations) {
        await this.assertQueue(queue, destination);
      }
    }
  }
}