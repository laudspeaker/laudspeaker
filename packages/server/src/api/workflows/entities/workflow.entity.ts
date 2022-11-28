import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum TriggerType {
  event,
  time_delay,
  time_window,
}

export interface IEventConditions {
  value: any;
  attribute: string;
  condition: string;
}

export class EventProps {
  conditions: IEventConditions[];
}

export class Trigger {
  type: TriggerType;
  source: string;
  dest: string[];
  properties: EventProps;
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
}
