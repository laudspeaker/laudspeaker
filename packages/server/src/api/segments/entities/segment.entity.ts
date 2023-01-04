import { Account } from '@/api/accounts/entities/accounts.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Segment {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  public user: Account;

  @Column()
  public name: string;

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

  @Column('jsonb')
  public resources: any;
}
