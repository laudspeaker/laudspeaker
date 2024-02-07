import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Journey } from './journey.entity';
import { Account } from '@/api/accounts/entities/accounts.entity';

@Entity()
export class JourneyChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => Journey, (journey) => journey.id, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  journey: Journey;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  changer: Account;

  @Column('jsonb')
  changedState: Omit<Journey, 'workspace' | 'visualLayout'>;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @JoinColumn()
  @OneToOne(() => JourneyChange, (journeyChange) => journeyChange.id, {
    nullable: true,
    onUpdate: 'CASCADE',
  })
  previousChange: JourneyChange | null;
}
