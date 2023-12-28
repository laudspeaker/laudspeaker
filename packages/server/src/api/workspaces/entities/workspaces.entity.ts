import {
  Account,
  PushFirebasePlatforms,
} from '@/api/accounts/entities/accounts.entity';
import { Organization } from '@/api/organizations/entities/organization.entity';
import { PushPlatforms } from '@/api/templates/entities/template.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum PlanType {
  FREE = 'free',
  PAID = 'paid',
  ENTERPRISE = 'enterprise',
}

@Entity()
export class Workspaces extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar' })
  public name!: string;

  @JoinColumn()
  @ManyToOne(() => Organization, (organization) => organization.workspaces, {
    onDelete: 'CASCADE',
  })
  public organization: Organization;

  @Column({ type: 'varchar', default: 'UTC+00:00', nullable: false })
  public timezoneUTCOffset: string; // must be in format `UTC(+/-)hh:mm`

  @Column({ type: 'varchar' })
  public apiKey!: string;

  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.FREE,
  })
  public plan: PlanType;

  @Column({ type: 'varchar', nullable: true })
  public mailgunAPIKey: string;

  @Column({ type: 'varchar', nullable: true })
  public sendingDomain: string;

  @Column({ type: 'varchar', nullable: true })
  public sendingEmail: string;

  @Column({ type: 'varchar', nullable: true })
  public sendingName: string;

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

  @Column('simple-array', { nullable: true })
  public posthogFirebaseDeviceTokenKey: string[];

  @Column({ type: 'varchar', nullable: true })
  public firebaseCredentials: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  public emailProvider?: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  public testSendingEmail?: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  public testSendingName?: string;

  @Column({ type: 'integer', nullable: false, default: 0 })
  public messagesSent: number;

  @Column({ type: 'int', default: 3 })
  public freeEmailsCount: number;

  @Column({ type: 'varchar', nullable: true })
  public sendgridApiKey?: string;

  @Column({ type: 'varchar', nullable: true })
  public sendgridFromEmail?: string;

  @Column({ type: 'varchar', nullable: true })
  public sendgridVerificationKey?: string;

  @Column({ type: 'varchar', nullable: true })
  public smsAccountSid?: string;

  @Column({ type: 'varchar', nullable: true })
  public smsAuthToken?: string;

  @Column({ type: 'varchar', nullable: true })
  public smsFrom?: string;

  @Column({ type: 'boolean', default: false })
  public posthogSetupped: boolean;

  @Column({ type: 'boolean', default: false })
  public javascriptSnippetSetupped: boolean;

  @Column({
    type: 'jsonb',
    default: {
      [PushPlatforms.IOS]: undefined,
      [PushPlatforms.ANDROID]: undefined,
    },
  })
  public pushPlatforms: PushFirebasePlatforms;
}

