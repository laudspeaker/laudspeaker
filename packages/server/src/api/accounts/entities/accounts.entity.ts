import { OrganizationTeam } from '@/api/organizations/entities/organization-team.entity';
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
@Unique(['email'])
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar' })
  public email!: string;

  @ManyToMany(() => OrganizationTeam, (team) => team.members)
  public teams: OrganizationTeam[];

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

  @Column({ type: 'boolean', default: false })
  public verified!: boolean;

  @Column({ type: 'varchar', array: true, default: [] })
  public expectedOnboarding: string[];

  @Column({ type: 'varchar', array: true, default: [] })
  public currentOnboarding: string[];

  @Column({ type: 'boolean', default: false })
  public onboarded: boolean;

  // Question - if it's still in use
  @Column({ type: 'varchar', nullable: true, default: null })
  public customerId?: string;
}
