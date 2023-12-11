import { Account } from '@/api/accounts/entities/accounts.entity';
import { PushPlatforms } from '@/api/templates/entities/template.entity';
import { Exclude } from 'class-transformer';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export type ImportsPreview = Record<
  string,
  {
    header: string;
    preview: any[];
  }
>;

@Entity()
@Unique(['account', 'fileKey'])
export class Imports extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  account: Account;

  @Column({ type: 'varchar' })
  public fileKey!: string;

  @Column({ type: 'varchar' })
  public fileName!: string;

  @Column({ type: 'jsonb' })
  public headers: ImportsPreview;
}
