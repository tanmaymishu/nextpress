import { Service } from 'typedi';
import { Permission, STATIC_PERMISSIONS } from '@/database/sql/entities/Permission';
import { Role } from '@/database/sql/entities/Role';
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
   * Create a default admin user with all permissions
   */
  async seedDefaultAdmin(): Promise<void> {
    try {
      let admin = await User.findOne({
        where: { email: 'admin@nextpress.test' },
        relations: ['permissions']
      });

      if (!admin) {
        logger.info('Creating default admin user...');

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('password', 10);

        admin = new User();
        admin.firstName = 'Admin';
        admin.lastName = 'User';
        admin.email = 'admin@nextpress.test';
        admin.password = hashedPassword;
        await admin.save();

        logger.info('Default admin user created: admin@nextpress.test / password');
        logger.warn('IMPORTANT: Change the default admin credentials in production!');
      } else {
        logger.info('Admin user already exists, ensuring permissions are assigned...');
      }

      // Always assign all permissions directly to the admin user
      await admin.assignAllPermissions();
      logger.info('Admin user has been assigned all permissions directly');
      
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
