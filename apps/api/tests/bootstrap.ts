import AuthService from '@/services/auth.service';
import { SeederService } from '@/services/seeder.service';
import Container from 'typedi';
import { AppDataSource } from '@/database/sql/data-source';

export async function initDB() {
  // Initialize if not already done (reuse existing connection)
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  // Drop all tables and recreate from entity definitions for clean test state (faster than migrations)
  await AppDataSource.dropDatabase();
  await AppDataSource.synchronize();
}

export async function refreshDB(seed: boolean = false) {
  await initDB();
  if (seed) {
    const seederService = new SeederService();
    await seederService.seedPermissions();
    await seederService.seedDefaultAdmin();
  }
}

export async function initUser() {
  return await Container.get(AuthService).createUser({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password'
  });
}
