import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ nullable: true })
  databricksHost?: string;

  @Column({ nullable: true })
  databricksPath?: string;

  @Column({ nullable: true })
  databricksToken?: string;
}
