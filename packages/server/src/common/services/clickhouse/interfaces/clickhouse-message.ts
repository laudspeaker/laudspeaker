import { ClickHouseEventProvider } from '../types/clickhouse-event-provider';

export interface ClickHouseMessage {
  audienceId?: string;
  stepId?: string;
  createdAt: Date;
  customerId: string;
  event: string;
  eventProvider: ClickHouseEventProvider;
  messageId: string;
  templateId: string;
  workspaceId: string;
  processed: boolean;
}