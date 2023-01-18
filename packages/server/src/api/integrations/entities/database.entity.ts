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
  POSTGRESQL = 'posgresql',
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
  syncToASegment: boolean;

  @Column()
  connectionString: string;

  @Column()
  dbType: string;

  @Column()
  query: string;
}
