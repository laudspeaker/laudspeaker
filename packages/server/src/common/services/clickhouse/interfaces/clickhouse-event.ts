import { ClickHouseEventSource } from "../types/clickhouse-event-source";

export interface ClickHouseEvent {
  id?: string;
  uuid: string;
  created_at?: Date;
  generated_at: Date
  correlation_key: string;
  correlation_value: string;
  event: string;
  payload: string;
  context?: string;
  source: ClickHouseEventSource;
  workspace_id: string;
  customer_id?: string;
}