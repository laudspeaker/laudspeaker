import { Account } from '@/api/accounts/entities/accounts.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  name: string;

  @Column()
  @ManyToOne(() => Account, (account) => account.id)
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
}
