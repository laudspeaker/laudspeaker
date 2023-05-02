import { Account } from '../../accounts/entities/accounts.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Filter extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  public user: Account;

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

  @Column({ default: true })
  public isFreezed: boolean;

  @Column('jsonb')
  public resources: any;
}
