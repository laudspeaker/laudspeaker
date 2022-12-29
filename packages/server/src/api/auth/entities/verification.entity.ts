import { Account } from '@/api/accounts/entities/accounts.entity';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Verification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column()
  @ManyToOne(() => Account, (account) => account.id)
  public account: Account;

  @Column({ type: 'varchar' })
  public email!: string;

  @Column({ type: 'varchar' })
  public status!: string;

  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt: Date | null;
}
