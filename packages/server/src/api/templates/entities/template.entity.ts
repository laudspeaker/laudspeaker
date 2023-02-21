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
  type: 'email' | 'slack' | 'sms' | 'firebase';

  @Column({ nullable: true })
  smsText: string;

  @Column({ nullable: true })
  pushText: string;

  @Column({ nullable: true })
  pushTitle: string;

  @Column({ default: false })
  isDeleted: boolean;
}
