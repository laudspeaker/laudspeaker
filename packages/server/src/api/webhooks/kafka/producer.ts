/* eslint-disable prettier/prettier */
import {
  Kafka,
  Message,
  Producer,
  ProducerBatch,
  TopicMessages,
} from 'kafkajs';
import { ClickHouseMessage } from '../entities/clickhouse';
import { ChangeStreamDocument } from 'typeorm';
import { CustomerDocument } from '@/api/customers/schemas/customer.schema';
import { KafkaMessageType, encodeMessage, getCustomerChangesTopic, getEventsTopic } from './utils';

export default class ProducerFactory {
  private producer: Producer;

  constructor() {
    this.producer = this.createProducer();
    // TODO: await this promise before interacting with the producer
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

  public async sendClickHouseBatch(
    messages: Array<ClickHouseMessage>
  ): Promise<void> {
    return await this.sendBatch(
      getEventsTopic(),
      messages.map((msg) =>
        encodeMessage({ type: KafkaMessageType.ClickHouse, message: msg })
      )
    );
  }

  public async sendCustomerChangedBatch(
    messages: Array<ChangeStreamDocument<CustomerDocument>>
  ): Promise<void> {
    return await this.sendBatch(
      getCustomerChangesTopic(),
      messages.map((msg) =>
        encodeMessage({
          type: KafkaMessageType.CustomerChanged,
          message: msg,
        })
      )
    );
  }

  private async sendBatch(
    topicStr: string,
    messages: Array<Message>
  ): Promise<void> {
    try {
      const topicMessages: TopicMessages = {
        topic: topicStr,
        messages,
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
