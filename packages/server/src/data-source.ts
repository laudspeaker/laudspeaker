import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from './api/accounts/entities/accounts.entity';
import { Audience } from './api/audiences/entities/audience.entity';
import { Stats } from './api/audiences/entities/stats.entity';
import { Installation } from './api/slack/entities/installation.entity';
import { State } from './api/slack/entities/state.entity';
import { Template } from './api/templates/entities/template.entity';
import { Workflow } from './api/workflows/entities/workflow.entity';
import { Migration1666691267551 } from './migrations/1666691267551-Migration';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'laudspeaker',
  synchronize: false,
  logging: false,
  entities: [Account, Audience, Installation, State, Stats, Template, Workflow],
  migrations: [Migration1666691267551],
  subscribers: [],
});
