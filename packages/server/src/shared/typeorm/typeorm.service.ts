import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
// TODO: remove after testing
import * as dotenv from 'dotenv';
// TODO: remove after testing
dotenv.config();

export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT ? +process.env.DATABASE_PORT : 5432,
      database: process.env.DATABASE_NAME || 'laudspeaker',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      entities: ['dist/**/*.entity.{ts,js}'],
      migrations: ['dist/**/migrations/*.{ts,js}'],
      migrationsTableName: 'typeorm_migrations',
      logger: 'file',
      logging: false,
      subscribers: [],
      synchronize: process.env.SYNCHRONIZE == 'true', // never use TRUE in production!
      autoLoadEntities: true,
      // migrationsRun: true,
    };
  }
}
