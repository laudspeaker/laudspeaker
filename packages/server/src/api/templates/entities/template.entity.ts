import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  name: string;

  @Column()
  ownerId: string;

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
