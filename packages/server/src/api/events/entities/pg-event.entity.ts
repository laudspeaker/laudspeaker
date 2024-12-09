import {
  Entity,
  Column,
  PrimaryColumn,
} from 'typeorm';

@Entity("events")
export class PGEvent {
  @PrimaryColumn('bigint')
  id: number;

  @Column('uuid')
  uuid: string;

  @Column('timestamp')
  created_at: Date;

  @Column('timestamp')
  generated_at: Date;

  @Column('timestamp')
  pg_sync_published_at: Date;

  @Column('timestamp')
  pg_sync_completed_at: Date;

  @Column()
  correlation_key: string;

  @Column()
  correlation_value: string;

  @Column()
  event: string;

  @Column('jsonb')
  payload: Record<string, any>;

  @Column('jsonb')
  context: Record<string, any>;

  @Column()
  source: string;

  @Column('uuid')
  workspace_id: string;

  @Column('bigint')
  customer_id: number;
}
