import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { AttributeType } from './attribute-type.entity';

@Entity()
export class AttributeParameter {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  key: string;

  @Column({ type: 'varchar', nullable: false })
  display_value: string;

  @Column({ type: 'varchar', nullable: true })
  example: string;

  @JoinColumn({ name: 'attribute_type_id' })
  @ManyToOne(() => AttributeType, (type) => type.id, {
    onDelete: 'CASCADE',
  })
  attribute_type: AttributeType;
}