CREATE TABLE IF NOT EXISTS message_status
(audienceId UUID, customerId String, templateId String, messageId String, event String, eventProvider String, createdAt DateTime, processed Boolean, userId String) 
ENGINE = ReplacingMergeTree
PRIMARY KEY (audienceId, customerId, templateId, messageId, event, eventProvider, createdAt);