import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Audience } from './audience.entity';

@Entity()
export class Stats {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @OneToOne(() => Audience, (audience) => audience.id, { onDelete: 'CASCADE' })
  @JoinColumn()
  public audience: Audience;

  @Column('int', { default: 0 })
  public sentAmount: number;
}
