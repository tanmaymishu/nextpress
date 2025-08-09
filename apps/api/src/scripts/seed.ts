import 'reflect-metadata';
import { AppDataSource } from '@/database/sql/data-source';
import { SeederService } from '@/services/seeder.service';

async function seed() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    console.log('Running database seeder...');
    const seederService = new SeederService();
    await seederService.runAllSeeders();

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seed();
