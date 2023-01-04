import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Segment } from '../../segments/entities/segment.entity';

export enum TriggerType {
  event,
  time_delay,
  time_window,
}

export interface IEventConditions {
  value: any;
  attribute?: string;
  condition?: string;
  key?: string;
  type?: string;
  comparisonType?: string;
  relationWithNext?: 'and' | 'or';
  isArray?: boolean;
}

export class EventProps {
  conditions: IEventConditions[];
}

export enum ProviderTypes {
  Posthog = 'posthog',
  Custom = 'custom',
}
export enum PosthogTriggerParams {
  Track = 'track',
  Page = 'page',
  Autocapture = 'autocapture',
}

export class Trigger {
  type: TriggerType;
  source: string;
  dest: string[];
  providerType?: ProviderTypes;
  providerParams?: PosthogTriggerParams;
  properties?: EventProps;
}

@Entity()
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name!: string;

  @Column()
  ownerId: string;

  @Column('boolean', { default: false })
  isActive: boolean;

  @Column('boolean', { default: false })
  isPaused: boolean;

  @Column('boolean', { default: false })
  isStopped: boolean;

  @Column('boolean', { default: false })
  isDeleted: boolean;

  @Column('text', { nullable: false, array: true, default: [] })
  audiences: string[];

  //This is actually an array of JSON stringified Trigger objects
  @Column('simple-array', { nullable: true })
  rules: string[];

  // {"nodes":[...list of nodes], "edges": [...list of edges]}
  @Column('jsonb', { nullable: true })
  visualLayout: any;

  @Column({ default: true })
  isDynamic: boolean;

  @ManyToOne(() => Segment, (segment) => segment.workflows)
  @JoinColumn()
  segment?: Segment;
}
