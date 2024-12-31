import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';

@Entity({ name: 'customer' })
export class Customer {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'uuid', default: () => 'uuid_generate_v7()', unique: true, nullable: false })
  @Index()
  uuid: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  user_attributes: any;

  @Column({ type: 'jsonb', default: {} })
  system_attributes: any;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  @Index()
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()' })
  @Index()
  updated_at: Date;

  @JoinColumn({ name: 'workspace_id' })
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspaces;

  @Column({ type: 'text', array: true, default: () => 'ARRAY[]::text[]' })
  other_ids: string[];

  @Column('uuid', { name: 'workspace_id', nullable: false })
  workspace_id: string;

  public getUserAttribute(attribute: string) {
    return this.user_attributes?.[attribute];
  }
}
