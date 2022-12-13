import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Audience {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column()
  name!: string;

  @Column()
  ownerId: string;

  @Column('varchar', { nullable: true })
  description: string;

  @Column('bool', { nullable: true, default: true })
  isPrimary: boolean;

  @Column('text', { nullable: false, array: true, default: [] })
  customers: string[];

  @Column('text', { nullable: false, array: true, default: [] })
  templates: string[];

  @Column('jsonb', { nullable: true })
  resources: any;

  @Column('bool', { default: true })
  isEditable: boolean;
}
