import { Account } from '@/api/accounts/entities/accounts.entity';
import { Template } from '@/api/templates/entities/template.entity';
import { Workflow } from '@/api/workflows/entities/workflow.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Audience {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column()
  name!: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  owner: Account;

  @JoinColumn()
  @ManyToOne(() => Workflow, (workflow) => workflow.id, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  workflow: Workflow;

  @Column('varchar', { nullable: true })
  description: string;

  @Column('bool', { nullable: true, default: true })
  isPrimary: boolean;

  @Column('text', { nullable: false, array: true, default: [] })
  customers: string[];

  @ManyToMany(() => Template)
  @JoinTable()
  templates: Template[];

  @Column('jsonb', { nullable: true })
  resources: any;

  @Column('bool', { default: true })
  isEditable: boolean;
}
