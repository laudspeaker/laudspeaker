import { Account } from '../../accounts/entities/accounts.entity';
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Segment } from './segment.entity';

@Entity()
export class SegmentCustomers extends BaseEntity {

  @PrimaryColumn({ name: 'segmentId' })
  @JoinColumn({ name: 'segmentId' })
  @ManyToOne(() => Segment, (segment) => segment.id, { onDelete: 'CASCADE' })
  public segment: string;
  
  @PrimaryColumn()
  public customerId: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  public owner: Account;

}
