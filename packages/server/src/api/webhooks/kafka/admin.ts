/* eslint-disable prettier/prettier */
import { Kafka, Admin } from 'kafkajs';

export default class AdminFactory {
  private kafkaAdmin: Admin;

  public constructor() {
    this.kafkaAdmin = this.createAdmin();
  }

  private createAdmin(): Admin {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: [process.env.KAFKA_BROKER_ADDRESS],
    });
    const consumer = kafka.admin();

    return consumer;
  }

  public async initTopics(): Promise<void> {
    // init a topic for each hour
    for (let i = 0; i < 24; i++) {
      await this.kafkaAdmin.createTopics({
        topics: [
          {
            topic: `events-hour-${i}`,
            numPartitions: 1,
            replicationFactor: 1,
          },
        ],
      });
    }
  }
}

