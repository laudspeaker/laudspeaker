import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { AttributeType } from './attribute-type.entity';
import { AttributeParameter } from './attribute-parameter.entity';

@Entity()
export class CustomerKey {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  @Index()
  name: string;

  @JoinColumn({ name: 'attribute_type_id' })
  @ManyToOne(() => AttributeType, (type) => type.id, {
    onDelete: 'CASCADE',
  })
  attribute_type: AttributeType;

  @JoinColumn({ name: 'attribute_subtype_id' })
  @ManyToOne(() => AttributeType, (type) => type.id, {
    onDelete: 'CASCADE',
  })
  attribute_subtype: AttributeType;

  @JoinColumn({ name: 'attribute_parameter_id' })
  @ManyToOne(() => AttributeParameter, (parameter) => parameter.id, {
    onDelete: 'CASCADE',
  })
  attribute_parameter: AttributeParameter;

  @Column({ type: 'bool', nullable: false })
  is_primary: boolean;

  @JoinColumn({ name: 'workspace_id' })
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspaces;
}

