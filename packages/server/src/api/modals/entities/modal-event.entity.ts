import { Template } from '../../templates/entities/template.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ModalEvent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @JoinColumn()
  @ManyToOne(() => Template, (template) => template.id, { onDelete: 'CASCADE' })
  public template: Template;

  @Column()
  public customerId: string;

  @Column('timestamp')
  public expiresAt: Date | null;
}

