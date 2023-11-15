import { ChangeStreamDocument } from 'typeorm';
import { ClickHouseMessage } from '../entities/clickhouse';
import { CustomerDocument } from '@/api/customers/schemas/customer.schema';
import { Message } from 'kafkajs';

export type KafkaMessageValue =
  | ClickHouseKafkaMessage
  | CustomerChangedKafkaMessage;

export enum KafkaMessageType {
  ClickHouse = 'clickhouse',
  CustomerChanged = 'customer_changed',
}

export interface ClickHouseKafkaMessage {
  type: KafkaMessageType.ClickHouse;
  message: ClickHouseMessage;
}

export interface CustomerChangedKafkaMessage {
  type: KafkaMessageType.CustomerChanged;
  message: ChangeStreamDocument<CustomerDocument>;
}

export function getEventsTopic(): string {
  return process.env.KAFKA_EVENTS_TOPIC ?? 'events';
}

export function getCustomerChangesTopic(): string {
  return process.env.KAFKA_CUSTOMER_CHANGES_TOPIC ?? 'customer-changes';
}

export function getUTCHourFromTimestamp(timestamp: string): number {
  const date = new Date(timestamp);
  return date.getUTCHours();
}

export function encodeMessage(message: KafkaMessageValue): Message {
  return {
    value: JSON.stringify(message),
  };
}

export function decodeMessage(message: Message): KafkaMessageValue {
  const value = message.value?.toString();
  if (!value) {
    throw new Error('Message value is empty');
  }
  try {
    // TODO: this should be replaced with typebox/zod for stronger type safety
    const parsedMessage = JSON.parse(value);
    if (!parsedMessage.type) {
      throw new Error('Message type is missing');
    }
    if ([...Object.values(KafkaMessageType)].includes(parsedMessage.type)) {
      throw new Error(`Message type "${parsedMessage.type}" is invalid`);
    }
    return parsedMessage as KafkaMessageValue;
  } catch {
    throw new Error('Message value is not a valid JSON');
  }
}
