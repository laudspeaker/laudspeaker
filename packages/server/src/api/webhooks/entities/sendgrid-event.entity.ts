import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SendgridEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  audienceId: string;

  @Column()
  customerId: string;

  @Column()
  messageId: string;

  @Column()
  event: string;

  @Column()
  createdAt: string;
}
