import {
  Account,
  PushFirebasePlatforms,
} from '@/api/accounts/entities/accounts.entity';
import { PushPlatforms } from '@/api/templates/entities/template.entity';
import { Workspace } from '@/api/workspaces/entities/workspace.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationTeam } from './organization-team.entity';

export enum PlanType {
  FREE = 'free',
  PAID = 'paid',
  ENTERPRISE = 'enterprise',
}

@Entity()
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar' })
  public companyName!: string;

  @OneToMany(() => OrganizationTeam, (team) => team.organization, {
    onDelete: 'CASCADE',
  })
  public teams: OrganizationTeam[];

  @OneToMany(() => Workspace, (workspace) => workspace.organization, {
    onDelete: 'CASCADE',
  })
  public workspaces: Workspace[];

  @JoinColumn()
  @OneToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  public owner: Account;
}
