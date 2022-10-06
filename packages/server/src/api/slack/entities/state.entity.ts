import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class State extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'jsonb' })
  public installUrlOptions: any;

  @Column({ type: 'timestamp' })
  public now: Date;
}
