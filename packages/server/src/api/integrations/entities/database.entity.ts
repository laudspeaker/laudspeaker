import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Integration } from './integration.entity';

export enum FrequencyUnit {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum PeopleIdentification {
  BY_ID = 'byId',
  BY_NAME = 'byName',
}

export enum DBType {
  DATABRICKS = 'databricks',
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
}

@Entity()
export class Database extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  frequencyNumber: number;

  @Column({ enum: FrequencyUnit })
  frequencyUnit: FrequencyUnit;

  @Column({ enum: PeopleIdentification })
  peopleIdentification: PeopleIdentification;

  @Column()
  connectionString: string;

  @Column({ enum: DBType })
  dbType: DBType;

  @Column()
  query: string;

  @Column({ default: new Date(0).toUTCString() })
  lastSync: string;

  @Column({ nullable: true })
  databricksHost?: string;

  @Column({ nullable: true })
  databricksPath?: string;

  @Column({ nullable: true })
  databricksToken?: string;

  @JoinColumn()
  @OneToOne(() => Integration, (integration) => integration.id, {
    onDelete: 'CASCADE',
  })
  integration: Integration;
}
