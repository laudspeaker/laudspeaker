import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { IsDate, IsDefined, ValidateIf } from 'class-validator';
import { Account } from '../../accounts/entities/accounts.entity';
import { Audience } from '../../audiences/entities/audience.entity';
import { Workflow } from '../../workflows/entities/workflow.entity';

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
  @ManyToOne(() => Audience, (audience) => audience.id, { onDelete: 'CASCADE' })
  from: Audience;

  @JoinColumn()
  @ManyToOne(() => Audience, (audience) => audience.id, { onDelete: 'CASCADE' })
  to: Audience;

  @JoinColumn()
  @ManyToOne(() => Workflow, (workflow) => workflow.id, { onDelete: 'CASCADE' })
  workflow: Workflow;

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
