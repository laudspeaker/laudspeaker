import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsDate, IsDefined, ValidateIf } from 'class-validator';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column({ type: 'varchar', nullable: false })
  owner: string;

  @Column({ type: 'varchar', nullable: false })
  from: string;

  @Column({ type: 'varchar', nullable: false })
  to: string;

  @Column({ type: 'varchar', nullable: false })
  workflow: string;

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
}
