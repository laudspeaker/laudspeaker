import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';


export enum AttributeTypeName {
  STRING = 'String',
  NUMBER = 'Number',
  BOOLEAN = 'Boolean',
  EMAIL = 'Email',
  DATE = 'Date',
  DATE_TIME = 'DateTime',
  ARRAY = 'Array',
  OBJECT = 'Object',
}

@Entity()
export class AttributeType {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  public id: number;

  @Column({ type: 'varchar', nullable: false })
  public name: string;

  @Column({ type: 'bool', nullable: false, default: false })
  public can_be_subtype: boolean;

  @Column({ type: 'bool', nullable: false, default: false })
  public subtype_required: boolean;

  @Column({ type: 'bool', nullable: false, default: false })
  public parameters_required: boolean;
}