import { Account } from '@/api/accounts/entities/accounts.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum SegmentType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

@Entity()
export class Segment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  public owner: Account;

  @Column()
  public name: string;

  @Column({ nullable: true })
  public description: string;

  @Column({ enum: SegmentType })
  public type: SegmentType;

  @Column('jsonb', { default: { conditionalType: 'and', conditions: [] } })
  public inclusionCriteria: any;

  @Column({ default: true })
  public isFreezed: boolean;

  @Column('jsonb')
  public resources: any;
}
