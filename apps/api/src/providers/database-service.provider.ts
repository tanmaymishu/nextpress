import { connect } from 'mongoose';
import { AppDataSource } from '@/database/sql/data-source';
import ServiceProvider from './service-provider';

export default class DatabaseServiceProvider extends ServiceProvider {
  async register() {
    // Skip database initialization here - it's handled in index.ts before seeders
    // This avoids race conditions and ensures proper initialization order
    
    // Connect to MongoDB. Example DSN: mongodb://username:password@localhost:27017/my_collection
    process.env.MONGO_DSN && (await connect(process.env.MONGO_DSN));
  }
}
