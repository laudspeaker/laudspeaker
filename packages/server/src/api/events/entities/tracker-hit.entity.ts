import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class TrackerHit extends BaseEntity {
  @PrimaryColumn()
  public hash!: string;

  @Column({ type: 'boolean', default: true })
  public processed: boolean;
}
