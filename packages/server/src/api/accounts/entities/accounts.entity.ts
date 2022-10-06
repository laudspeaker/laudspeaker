import { Exclude } from 'class-transformer';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  PrimaryColumn,
} from 'typeorm';

@Entity()
@Unique(['email', 'apiKey'])
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column({ type: 'varchar' })
  public email!: string;

  @Column({ type: 'varchar' })
  public apiKey!: string;

  @Exclude()
  @Column({ type: 'varchar' })
  public password!: string;

  @Column({ type: 'varchar', nullable: true })
  public firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  public lastName: string | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  public lastLoginAt: Date | null;

  @Column({ type: 'boolean', default: false })
  public verified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  public mailgunAPIKey: string;

  @Column({ type: 'varchar', nullable: true })
  public sendingDomain: string;

  @Column({ type: 'varchar', nullable: true })
  public sendingEmail: string;

  @Column({ type: 'varchar', nullable: true })
  public sendingName: string;

  // @Column({ type: 'varchar', nullable: true })
  // public slackTeamId: string;

  @Column('simple-array', { nullable: true })
  public slackTeamId: string[];

  @Column('simple-array', { nullable: true })
  public posthogApiKey: string[];

  @Column('simple-array', { nullable: true })
  public posthogProjectId: string[];

  @Column('simple-array', { nullable: true })
  public posthogHostUrl: string[];

  @Column('simple-array', { nullable: true })
  public posthogSmsKey: string[];

  @Column('simple-array', { nullable: true })
  public posthogEmailKey: string[];

  @Column({ type: 'varchar', array: true, default: [] })
  public expectedOnboarding: string[];

  @Column({ type: 'varchar', array: true, default: [] })
  public currentOnboarding: string[];

  @Column({ type: 'boolean', default: false })
  public onboarded: boolean;
}
