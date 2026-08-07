DROP TABLE IF EXISTS event_sync_trigger;
CREATE MATERIALIZED VIEW event_sync_trigger TO events_pg_sync
AS SELECT
    now64() as pg_sync_published_at,
    *
FROM events;