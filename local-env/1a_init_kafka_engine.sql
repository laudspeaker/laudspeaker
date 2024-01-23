CREATE TABLE IF NOT EXISTS message_status
(stepId UUID, customerId String, templateId String, messageId String, event String, eventProvider String, createdAt DateTime, processed Boolean, userId UUID) 
ENGINE = ReplacingMergeTree
PRIMARY KEY (stepId, customerId, templateId, messageId, event, eventProvider, createdAt);


-- READ FIRST --
-- The rest of this migration allows you to ingest
-- kafka messages directly into the message_status table.
-- In a cloud environment, this connection will be setup using the 
-- cloud's GUI or other means. This migration should only work
-- in local development, or similar environments.

-- create kafka ingestion
CREATE TABLE IF NOT EXISTS message_status_kafka
(
    stepId UUID,
    customerId String,
    templateId String,
    messageId String,
    event String,
    eventProvider String,
    createdAt DateTime,
    processed Boolean,
    userId UUID
) 
ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'kafka1:19092',
    -- IMPORTANT: ensure this matches with KAFKA_TOPIC_MESSAGE_STATUS
    -- in packages/server/src/kafka/constants.ts
    kafka_topic_list = 'message_status',
    kafka_group_name = 'clickhouse_message_status',
    kafka_format = 'JSONEachRow',
    date_time_input_format='best_effort'
;

-- create materialized view to copy kafka queue data into message_status table
CREATE MATERIALIZED VIEW message_status_mv TO message_status AS
    SELECT *
    FROM message_status_kafka
;