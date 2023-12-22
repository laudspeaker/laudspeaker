import {
  Account,
  PlanType,
  PushFirebasePlatforms,
} from '@/api/accounts/entities/accounts.entity';
import { PushPlatforms } from '@/api/templates/entities/template.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity()
export class OrganizationTeam extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @JoinColumn()
  @ManyToOne(() => Organization, (organization) => organization.teams, {
    onDelete: 'CASCADE',
  })
  public organization: Organization;

  @Column({ type: 'varchar', default: 'Default team' })
  public teamName!: string;

  @ManyToMany(() => Account, (account) => account.teams)
  @JoinTable()
  public members: Account[];
}

