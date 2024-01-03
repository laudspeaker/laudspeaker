ALTER TABLE message_status
ADD COLUMN IF NOT EXISTS workspaceId String;

-- column userId will be deleted using migration 1704290212934-ClickHouseWorkspaceIdFill