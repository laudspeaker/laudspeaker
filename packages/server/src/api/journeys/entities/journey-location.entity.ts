import { Account } from '../../accounts/entities/accounts.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  ManyToMany,
  CreateDateColumn,
} from 'typeorm';
import { VisualLayout } from '../types/visual-layout.interface';
import { Step } from '@/api/steps/entities/step.entity';
import { Journey } from './journey.entity';
import { Workspaces } from '@/api/workspaces/entities/workspaces.entity';

@Entity()
export class JourneyLocation {
  @PrimaryColumn({ name: 'journeyId' })
  @ManyToOne(() => Journey, (journey) => journey.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journeyId' })
  public journey!: string;

  @PrimaryColumn()
  customer!: string;

  @JoinColumn()
  @ManyToOne(() => Step, (step) => step.id, { onDelete: 'CASCADE' })
  step!: Step;

  @JoinColumn()
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace!: Workspaces;

  // This is actually a timestamp using ECMAScript's native Date object; will yield
  // the same number across any timezone
  @Column({ type: 'bigint', nullable: false })
  stepEntry!: number;

  // This is actually a timestamp using ECMAScript's native Date object; will yield
  // the same number across any timezone
  @Column({
    type: 'bigint',
    nullable: true,
  })
  moveStarted?: number | null;

  // This column is used to keep track of unique customers who've received a message
  // for a journey. Allows for rate limiting by customers receiving messages.
  @Column({
    type: 'boolean',
    nullable: true,
  })
  messageSent?: boolean | null;
}
