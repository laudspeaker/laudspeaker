/* eslint-disable prettier/prettier */
import {
  Consumer,
  ConsumerSubscribeTopics,
  EachBatchPayload,
  Kafka,
  KafkaMessage,
} from 'kafkajs';

type MessageProcessor = {
  (messages: KafkaMessage[], eachBatchPayload: EachBatchPayload): Promise<boolean>;
};

export default class ConsumerFactory {
  private kafkaConsumer: Consumer;
  private messageProcessor: MessageProcessor;
  private messageTimeout: NodeJS.Timeout | null = null;

  public constructor(messageProcessor: MessageProcessor) {
    this.messageProcessor = messageProcessor;
    this.kafkaConsumer = this.createKafkaConsumer();
  }

  public async startBatchConsumer(topicStr: string, options?: { inactivityTimeout: boolean }): Promise<void> {
    const topic: ConsumerSubscribeTopics = {
      topics: [topicStr],
      fromBeginning: true,
    };

    try {
      await this.kafkaConsumer.connect();
      await this.kafkaConsumer.subscribe(topic);
      await this.kafkaConsumer.run({
        eachBatch: async (eachBatchPayload: EachBatchPayload) => {
          const { batch } = eachBatchPayload;
          if (options.inactivityTimeout){
            this.resetMessageTimeout();
          }
          const shouldShutdown = await this.messageProcessor(batch.messages, eachBatchPayload);

          if (shouldShutdown) {
            this.shutdown();
          }
        },
      });
    } catch (error) {
      console.log('Error: ', error);
    }
  }

  private setMessageTimeout() {
    this.messageTimeout = setTimeout(() => {
      console.log('No message received for 5 minutes, shutting down consumer.');
      this.shutdown();
    }, 300000); // 5 minutes
  }

  private resetMessageTimeout() {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    this.setMessageTimeout();
  }

  public async shutdown(): Promise<void> {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    await this.kafkaConsumer.disconnect();
  }

  private createKafkaConsumer(): Consumer {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: [process.env.KAFKA_BROKER_ADDRESS],
    });
    const consumer = kafka.consumer({
      groupId: process.env.KAFKA_EVENTS_CONSUMER_GROUP,
      maxBytes: 10 * 1024 * 1024, // 10 mebibytes
    });

    return consumer;
  }
}

export function getEventsTopicForHour(hour: number): string {
  return `events-hour-${hour}`;
}

export function getEventsTopicForPastHour(): string {
  const date = new Date();
  date.setHours(date.getHours() - 1);
  return getEventsTopicForHour(date.getUTCHours());
}

