/* eslint-disable prettier/prettier */
import {
  Kafka,
  Message,
  Producer,
  ProducerBatch,
  TopicMessages,
} from 'kafkajs';
import { ClickHouseMessage } from '../entities/clickhouse';

export default class ProducerFactory {
  private producer: Producer;

  constructor() {
    this.producer = this.createProducer();
    this.start();
  }

  public async start(): Promise<void> {
    try {
      await this.producer.connect();
    } catch (error) {
      console.log('Error connecting the producer: ', error);
    }
  }

  public async shutdown(): Promise<void> {
    await this.producer.disconnect();
  }

  public async sendBatch(
    topicStr: string,
    messages: Array<ClickHouseMessage>
  ): Promise<void> {
    try {
      const kafkaMessages: Array<Message> = messages.map((message) => {
        return {
          value: JSON.stringify(message),
        };
      });

      const topicMessages: TopicMessages = {
        topic: topicStr,
        messages: kafkaMessages,
      };

      const batch: ProducerBatch = {
        topicMessages: [topicMessages],
      };

      console.log('sending batch: ', batch);

      await this.producer.sendBatch(batch);
    } catch (e) {
      console.log('Error sending batch: ', e);
    }
  }

  private createProducer(): Producer {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: [
        // TODO: this should support multiple brokers
        process.env.KAFKA_BROKER_ADDRESS,
      ],
    });

    return kafka.producer();
  }
}

export function getEventsTopic(): string {
  return process.env.KAFKA_EVENTS_TOPIC;
}

export function getUTCHourFromTimestamp(timestamp: string): number {
  const date = new Date(timestamp);
  return date.getUTCHours();
}

