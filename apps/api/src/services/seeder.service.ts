import { Service } from 'typedi';
import { Permission, STATIC_PERMISSIONS } from '@/database/sql/entities/Permission';
import { User } from '@/database/sql/entities/User';
import logger from '../util/logger';

@Service()
export class SeederService {

  /**
   * Seed all permissions from the static array
   */
  async seedPermissions(): Promise<void> {
    try {
      logger.info('Seeding permissions...');
      await Permission.seedPermissions();
      logger.info(`Successfully seeded ${STATIC_PERMISSIONS.length} permissions`);
    } catch (error) {
      logger.error('Error seeding permissions:', error);
      throw error;
    }
  }

  /**
   * Create a default admin user with all permissions (only if no users exist)
   */
  async seedDefaultAdmin(): Promise<void> {
    try {
      const userCount = await User.count();

      if (userCount === 0) {
        logger.info('No users found. Creating default admin user...');

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('password', 10);

        const admin = new User();
        admin.firstName = 'Admin';
        admin.lastName = 'User';
        admin.email = 'admin@nextpress.test';
        admin.password = hashedPassword;
        await admin.save();

        // First user automatically gets all permissions via isFirstUser logic
        await admin.assignAllPermissions();

        logger.info('Default admin user created: admin@nextpress.test / password');
        logger.info('Admin user has been assigned all permissions as first user');
        logger.info('IMPORTANT: Change the default admin credentials in production!');
      } else {
        logger.info('Users already exist. Skipping admin creation...');

        // Ensure first user has admin permissions
        const firstUser = await User.findFirstUser();
        if (firstUser && !(firstUser.isAdmin)) {
          await firstUser.assignAllPermissions();
          logger.info('Ensured first user has admin permissions');
        }
      }

    } catch (error) {
      logger.error('Error seeding default admin:', error);
      throw error;
    }
  }

  /**
   * Run all seeders
   */
  async runAllSeeders(): Promise<void> {
    try {
      logger.info('Starting simple database seeding...');

      await this.seedPermissions();
      await this.seedDefaultAdmin();

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }
}
