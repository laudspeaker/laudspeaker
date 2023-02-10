import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import * as dotenv from 'dotenv';

dotenv.config();

const config = new TypeOrmConfigService().createTypeOrmOptions();
const DS = new DataSource(config as DataSourceOptions);

export default DS;
