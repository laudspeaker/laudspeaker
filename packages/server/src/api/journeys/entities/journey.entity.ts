import { Account } from '../../accounts/entities/accounts.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { VisualLayout } from '../types/visual-layout.interface';

@Entity()
export class Journey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  owner: Account;

  @Column('boolean', { default: false })
  isActive: boolean;

  @Column('boolean', { default: false })
  isPaused: boolean;

  @Column('boolean', { default: false })
  isStopped: boolean;

  @Column('boolean', { default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  stoppedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  latestPause?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  latestSave?: Date;

  // {"nodes":[...list of nodes], "edges": [...list of edges]}
  @Column('jsonb', { nullable: true })
  visualLayout: VisualLayout;

  @Column({ default: true })
  isDynamic: boolean;

  @Column('jsonb', { default: { conditionalType: 'and', conditions: [] } })
  inclusionCriteria: any;
}
