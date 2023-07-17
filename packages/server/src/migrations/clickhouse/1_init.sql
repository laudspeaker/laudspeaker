CREATE TABLE IF NOT EXISTS message_status
(stepId UUID, customerId String, templateId String, messageId String, event String, eventProvider String, createdAt DateTime, processed Boolean, userId UUID) 
ENGINE = ReplacingMergeTree
PRIMARY KEY (stepId, customerId, templateId, messageId, event, eventProvider, createdAt);