import { Account } from '../../accounts/entities/accounts.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Workspace } from '@/api/workspaces/entities/workspace.entity';

export enum SegmentType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

@Entity()
export class Segment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @JoinColumn()
  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspace;

  @Column()
  public name: string;

  @Column({ nullable: true })
  public description: string;

  @Column({ enum: SegmentType })
  public type: SegmentType;

  @Column('jsonb', { default: { conditionalType: 'and', conditions: [] } })
  public inclusionCriteria: any;

  @Column({ default: true })
  public isFreezed: boolean;

  @Column('jsonb', {
    default: {
      conditions: {
        id: 'conditions',
        type: 'select',
        label: 'filter on',
        options: [
          {
            label: 'select',
            id: '',
            isPlaceholder: true,
          },
          {
            label: 'Attributes',
            id: 'attributes',
          },
        ],
      },
    },
  })
  public resources: any;
}
