import 'reflect-metadata';
import { AppDataSource } from '@/database/sql/data-source';

async function fresh() {
  try {
    console.log('🗑️  Dropping database...');
    
    // Initialize connection to check if database exists
    let isInitialized = false;
    try {
      await AppDataSource.initialize();
      isInitialized = true;
      
      // Drop the database using TypeORM's method
      await AppDataSource.dropDatabase();
      console.log('✅ Database dropped successfully');
      
      // Close the connection
      await AppDataSource.destroy();
    } catch (error) {
      if (isInitialized) {
        await AppDataSource.destroy();
      }
      // If database doesn't exist, that's fine - we'll create it fresh
      console.log('📝 Database did not exist or was already clean');
    }
    
    console.log('🔧 Running fresh migrations...');
    
    // Reinitialize and run migrations
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    
    console.log('✅ Fresh migrations completed successfully!');
    console.log('💡 Run "pnpm seed" to populate the database with initial data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fresh migration failed:', error);
    process.exit(1);
  }
}

fresh();