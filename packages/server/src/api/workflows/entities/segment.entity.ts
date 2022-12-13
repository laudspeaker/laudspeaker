import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Segment {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

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
  public inclusionCriteria: any;

  @Column({ default: false })
  public isFreezed: boolean;
}
