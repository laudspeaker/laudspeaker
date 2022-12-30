import { Account } from '@/api/accounts/entities/accounts.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  owner: Account;

  @Column({ nullable: true })
  text: string;

  @Column({ nullable: true })
  style: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  slackMessage: string;

  @Column()
  type: 'email' | 'slack' | 'sms';

  @Column({ nullable: true })
  smsText: string;
}
