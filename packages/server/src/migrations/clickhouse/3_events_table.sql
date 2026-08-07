SET allow_experimental_json_type = 1;

CREATE TABLE IF NOT EXISTS events
(
  id                  UInt64          DEFAULT generateSnowflakeID(),
  uuid                UUID            DEFAULT generateUUIDv7(),
  created_at          Datetime64(6)   DEFAULT now64(),
  generated_at        Datetime64(6)   NOT NULL,
  correlation_key     String          NOT NULL,
  correlation_value   String          NOT NULL,
  event               String          NOT NULL,
  payload             JSON            NOT NULL,
  context             JSON            NOT NULL,
  source              String          NOT NULL,
  customer_id         String,
  workspace_id        UUID            NOT NULL,
)
ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS events_pg_sync (
  pg_sync_published_at    Datetime64(6)   NOT NULL,
  id                      UInt64          NOT NULL DEFAULT generateSnowflakeID(),
  uuid                    UUID            NOT NULL DEFAULT generateUUIDv7(),
  created_at              Datetime64(6)   NOT NULL DEFAULT now64(),
  generated_at            Datetime64(6)   NOT NULL,
  correlation_key         String          NOT NULL,
  correlation_value       String          NOT NULL,
  event                   String          NOT NULL,
  payload                 JSON            NOT NULL,
  context                 JSON            NOT NULL,
  source                  String          NOT NULL,
  customer_id             String,
  workspace_id            UUID            NOT NULL,
) ENGINE = RabbitMQ SETTINGS
  rabbitmq_host_port = 'rabbitmq:5672',
  rabbitmq_exchange_name = '',
  -- rabbitmq_exchange_type = 'direct',
  rabbitmq_format = 'JSONEachRow',
  rabbitmq_persistent = 1,
  rabbitmq_queue_consume  = 1,
  rabbitmq_max_rows_per_message = 100,
  rabbitmq_routing_key_list = 'events_pg_sync.pending', 
  rabbitmq_queue_base = 'events_pg_sync.pending';
