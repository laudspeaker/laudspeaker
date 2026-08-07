import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { IsDate, IsDefined, ValidateIf } from 'class-validator';
import { Account } from '../../accounts/entities/accounts.entity';
import { Step } from '../../steps/entities/step.entity';
import { Journey } from '../../journeys/entities/journey.entity';

export enum TimeJobType {
  DELAY,
  SPECIFIC_TIME,
  TIME_WINDOW,
}

export enum TimeJobStatus {
  IN_PROGRESS,
  PENDING,
}

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  public id!: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  owner: Account;

  @JoinColumn()
  @ManyToOne(() => Step, (step) => step.id, { onDelete: 'CASCADE' })
  from: Step;

  @JoinColumn()
  @ManyToOne(() => Step, (step) => step.id, { onDelete: 'CASCADE' })
  to: Step;

  @JoinColumn()
  @ManyToOne(() => Journey, (journey) => journey.id, { onDelete: 'CASCADE' })
  workflow: Journey;

  @Column({ type: 'varchar', nullable: false })
  customer: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  @ValidateIf((o) => !o.startTime && !o.endTime)
  @IsDefined()
  @IsDate()
  executionTime: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  @ValidateIf((o) => o.endTime)
  @IsDefined()
  @IsDate()
  startTime: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  @ValidateIf((o) => o.startTime)
  @IsDefined()
  @IsDate()
  endTime: Date;

  @Column({ enum: TimeJobType })
  type: TimeJobType;

  @Column({ enum: TimeJobStatus, default: TimeJobStatus.PENDING })
  status: TimeJobStatus;
}
