import dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
// import { CustomLogger } from '@/database/sql/custom-logger';
if (process.env.NODE_ENV == 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config({ path: '.env' });
}

export const AppDataSource = new DataSource({
  synchronize: false,
  type: process.env.DB_CLIENT,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // logger: new CustomLogger(),
  logging: process.env.NODE_ENV === 'development',
  entities: [
    `./${
      process.env.NODE_ENV == 'production' ? 'dist/src' : 'src'
    }/database/sql/entities/*.{js,ts}`
  ],
  migrations: [
    `./${
      process.env.NODE_ENV == 'production' ? 'dist/src' : 'src'
    }/database/sql/migrations/*`
  ],
  namingStrategy: new SnakeNamingStrategy()
} as DataSourceOptions);
