import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as os from 'os';

export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  public createTypeOrmOptions(): TypeOrmModuleOptions {
    console.log(`Primary ${process.pid} is running`);

    let totalMaxConnections = process.env.DATABASE_MAX_CONNECTIONS
      ? +process.env.DATABASE_MAX_CONNECTIONS
      : 100;
    let maxReplicas = process.env.DEPLOY_MAX_REPLICAS
      ? +process.env.DEPLOY_MAX_REPLICAS
      : 1;

    let connectionsPerReplica = Math.floor(totalMaxConnections / maxReplicas);

    let maxProcessCountPerReplica = process.env.MAX_PROCESS_COUNT_PER_REPLICA
      ? +process.env.MAX_PROCESS_COUNT_PER_REPLICA
      : 1;

    let maxDBConnectionsPerReplicaProcess = Math.floor(
      connectionsPerReplica / maxProcessCountPerReplica
    );

    maxDBConnectionsPerReplicaProcess = process.env
      .MAX_DB_CONNECTIONS_PER_REPLICA_PROCESS
      ? +process.env.MAX_DB_CONNECTIONS_PER_REPLICA_PROCESS
      : maxDBConnectionsPerReplicaProcess;

    console.log(`TypeOrmConfigService settings:
        totalMaxConnections: (${totalMaxConnections}),
        maxReplicas: (${maxReplicas}),
        connectionsPerReplica: (${connectionsPerReplica}),
        maxProcessCountPerReplica: (${maxProcessCountPerReplica}),
        maxDBConnectionsPerReplicaProcess: (${maxDBConnectionsPerReplicaProcess})`);

    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT ? +process.env.DATABASE_PORT : 5432,
      database: process.env.DATABASE_NAME || 'laudspeaker',
      ssl: process.env.DATABASE_SSL === 'true' ? true : false,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      entities: ['dist/**/*.entity.{ts,js}'],
      migrations: ['dist/**/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'advanced-console',
      logging: ['warn', 'error'],
      subscribers: [],
      synchronize: process.env.SYNCHRONIZE == 'true', // never use TRUE in production!
      autoLoadEntities: true,
      maxQueryExecutionTime: 2000,
      extra: {
        options:
          '-c lock_timeout=240000ms -c statement_timeout=240000ms -c idle_in_transaction_session_timeout=240000ms',
      },
      // migrationsRun: true,
    };
  }
}
