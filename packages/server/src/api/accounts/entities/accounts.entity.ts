import { OrganizationTeam } from '@/api/organizations/entities/organization-team.entity';
import { Organization } from '@/api/organizations/entities/organization.entity';
import { PushPlatforms } from '@/api/templates/entities/template.entity';
import { Exclude } from 'class-transformer';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum PlanType {
  FREE = 'free',
  PAID = 'paid',
  ENTERPRISE = 'enterprise',
}

export type PushFirebasePlatforms = Record<
  PushPlatforms,
  | {
      fileName: string;
      credentials: JSON;
      isTrackingDisabled: boolean;
    }
  | undefined
>;

@Entity()
@Unique(['email', 'apiKey'])
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar' })
  public email!: string;

  @ManyToMany(() => OrganizationTeam, (team) => team.members)
  public teams: OrganizationTeam[];

  public organization?: Organization;

  // REMOVE
  @Column({ type: 'varchar' })
  public apiKey!: string;

  @Exclude()
  @Column({ type: 'varchar' })
  public password!: string;

  @Column({ type: 'varchar', nullable: true })
  public firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  public lastName: string | null;

  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public accountCreatedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  public lastLoginAt: Date | null;

  @Column({ type: 'integer', nullable: false, default: 0 })
  public messagesSent: number;

  // REMOVE
  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.FREE,
  })
  public plan: PlanType;

  @Column({ type: 'boolean', default: false })
  public verified!: boolean;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public mailgunAPIKey: string;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public sendingDomain: string;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public sendingEmail: string;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public sendingName: string;

  // remove
  @Column('simple-array', { nullable: true })
  public slackTeamId: string[];

  // remove
  @Column('simple-array', { nullable: true })
  public posthogApiKey: string[];

  // remove
  @Column('simple-array', { nullable: true })
  public posthogProjectId: string[];

  // remove
  @Column('simple-array', { nullable: true })
  public posthogHostUrl: string[];

  // remove
  @Column('simple-array', { nullable: true })
  public posthogSmsKey: string[];

  // remove
  @Column('simple-array', { nullable: true })
  public posthogEmailKey: string[];

  // remove
  @Column('simple-array', { nullable: true })
  public posthogFirebaseDeviceTokenKey: string[];

  // remove
  @Column({ type: 'varchar', nullable: true })
  public firebaseCredentials: string;

  @Column({ type: 'varchar', array: true, default: [] })
  public expectedOnboarding: string[];

  @Column({ type: 'varchar', array: true, default: [] })
  public currentOnboarding: string[];

  @Column({ type: 'boolean', default: false })
  public onboarded: boolean;

  // Question - if it's still in use
  @Column({ type: 'varchar', nullable: true, default: null })
  public customerId?: string;

  // remove
  @Column({ type: 'varchar', nullable: true, default: null })
  public emailProvider?: string;

  // remove
  @Column({ type: 'varchar', nullable: true, default: null })
  public testSendingEmail?: string;

  // remove
  @Column({ type: 'varchar', nullable: true, default: null })
  public testSendingName?: string;

  // remove
  @Column({ type: 'int', default: 3 })
  public freeEmailsCount: number;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public sendgridApiKey?: string;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public sendgridFromEmail?: string;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public sendgridVerificationKey?: string;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public smsAccountSid?: string;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public smsAuthToken?: string;

  // remove
  @Column({ type: 'varchar', nullable: true })
  public smsFrom?: string;

  // remove
  @Column({ type: 'boolean', default: false })
  public posthogSetupped: boolean;

  // remove
  @Column({ type: 'boolean', default: false })
  public javascriptSnippetSetupped: boolean;

  // remove
  @Column({ type: 'varchar', default: 'UTC+00:00', nullable: false })
  public timezoneUTCOffset: string; // must be in format `UTC(+/-)hh:mm`

  // remove
  @Column({
    type: 'jsonb',
    default: {
      [PushPlatforms.IOS]: undefined,
      [PushPlatforms.ANDROID]: undefined,
    },
  })
  public pushPlatforms: PushFirebasePlatforms;
}
