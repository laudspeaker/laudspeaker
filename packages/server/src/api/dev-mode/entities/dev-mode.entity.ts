import { Account } from '@/api/accounts/entities/accounts.entity';
import { Customer } from '@/api/customers/schemas/customer.schema';
import { Journey } from '@/api/journeys/entities/journey.entity';
import { Workspace } from '@/api/workspaces/entities/workspace.entity';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export interface DevModeState {
  customerIn: {
    nodeId: string;
    stepId: string;
  };
  customerData: Customer;
  customerStory: Record<string, Customer>;
}

@Entity()
export class DevMode extends BaseEntity {
  @PrimaryColumn('uuid')
  @JoinColumn({ name: 'workspaceId' })
  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspaceId: string;

  @PrimaryColumn('uuid')
  @JoinColumn({ name: 'journeyId' })
  @ManyToOne(() => Journey, (journey) => journey.id, { onDelete: 'CASCADE' })
  public journeyId: string;

  @Column({ type: 'jsonb' })
  public devModeState!: DevModeState;
}
