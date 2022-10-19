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

  @Column('bool', { default: true })
  isDynamic: boolean;

  @Column('text', { nullable: false, array: true, default: [] })
  customers: string[];

  @Column('text', { nullable: false, array: true, default: [] })
  templates: string[];

  /*
      {
          conditionalType: ...,
          conditions: [
            {
              attribute: "email",
              "value": "doesNotExist"
            },
            {
              "attribute": "lastName",
              "condition": "isEqual",
              "value": "hello"
            }
          ]
        }
  */
  @Column('jsonb', { default: { conditionalType: 'and', conditions: [] } })
  inclusionCriteria: any;

  @Column('jsonb', { nullable: true })
  resources: any;

  @Column('bool', { default: true })
  isEditable: boolean;
}
