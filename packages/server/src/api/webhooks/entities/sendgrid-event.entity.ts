import { Audience } from '@/api/audiences/entities/audience.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SendgridEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @ManyToOne(() => Audience, (audience) => audience.id)
  audience: Audience;

  @Column()
  customerId: string;

  @Column()
  messageId: string;

  @Column()
  event: string;

  @Column()
  createdAt: string;
}
