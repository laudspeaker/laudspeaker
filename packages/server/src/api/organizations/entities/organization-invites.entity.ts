import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationTeam } from './organization-team.entity';
import { Organization } from './organization.entity';

@Entity()
export class OrganizationInvites extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @JoinColumn()
  @ManyToOne(() => Organization, (organization) => organization.teams, {
    onDelete: 'CASCADE',
  })
  public organization: Organization;

  @JoinColumn()
  @ManyToOne(() => OrganizationTeam, (team) => team.id, {
    onDelete: 'CASCADE',
  })
  public team: OrganizationTeam;

  @Column({ type: 'varchar' })
  public email: string;

  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt: Date | null;
}
