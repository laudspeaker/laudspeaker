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
export class Verification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
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
