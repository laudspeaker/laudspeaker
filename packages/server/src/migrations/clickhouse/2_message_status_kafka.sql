-- update message_status to accept proper ISO6801 format
ALTER TABLE message_status 
MODIFY SETTING
    date_time_input_format='best_effort'
;


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
    kafka_broker_list = 'kafka1:29092',
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