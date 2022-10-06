import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Installation extends BaseEntity {
  @PrimaryColumn('varchar')
  public id: string;

  @Column({ type: 'jsonb' })
  public installation: any;
}
