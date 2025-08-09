import { Service } from 'typedi';
import { Permission, STATIC_PERMISSIONS } from '../database/sql/entities/Permission';
import { Role } from '../database/sql/entities/Role';
import { User } from '../database/sql/entities/User';
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
   * Seed default role permissions
   */
  async seedRolePermissions(): Promise<void> {
    try {
      logger.info('Seeding default role permissions...');

      // Admin gets all permissions
      const adminRole = await Role.findOne({ 
        where: { name: 'admin' },
        relations: ['permissions']
      });
      
      if (adminRole) {
        const allPermissions = await Permission.find();
        adminRole.permissions = allPermissions;
        await adminRole.save();
        logger.info('Admin role assigned all permissions');
      }

      // User gets basic permissions
      const userRole = await Role.findOne({ 
        where: { name: 'user' },
        relations: ['permissions']
      });
      
      if (userRole) {
        const basicPermissions = await Permission.find({
          where: [
            { name: 'dashboard.analytics' }
          ]
        });
        userRole.permissions = basicPermissions;
        await userRole.save();
        logger.info('User role assigned basic permissions');
      }

      // Moderator gets intermediate permissions
      const moderatorRole = await Role.findOne({ 
        where: { name: 'moderator' },
        relations: ['permissions']
      });
      
      if (moderatorRole) {
        const moderatorPermissions = await Permission.find({
          where: [
            { name: 'users.read' },
            { name: 'users.update' },
            { name: 'roles.read' },
            { name: 'permissions.read' },
            { name: 'dashboard.admin' },
            { name: 'dashboard.analytics' }
          ]
        });
        moderatorRole.permissions = moderatorPermissions;
        await moderatorRole.save();
        logger.info('Moderator role assigned intermediate permissions');
      }

    } catch (error) {
      logger.error('Error seeding role permissions:', error);
      throw error;
    }
  }

  /**
   * Create a default admin user if none exists
   */
  async seedDefaultAdmin(): Promise<void> {
    try {
      const adminExists = await User.findOne({
        where: { email: 'admin@nextpress.dev' }
      });

      if (!adminExists) {
        logger.info('Creating default admin user...');
        
        // Note: In production, you should use a secure password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = new User();
        admin.firstName = 'Admin';
        admin.lastName = 'User';
        admin.email = 'admin@nextpress.dev';
        admin.password = hashedPassword;
        await admin.save();

        // Assign admin role
        await admin.assignRole('admin');
        
        logger.info('Default admin user created: admin@nextpress.dev / admin123');
        logger.warn('IMPORTANT: Change the default admin password in production!');
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
      logger.info('Starting database seeding...');
      
      await this.seedPermissions();
      await this.seedRolePermissions();
      await this.seedDefaultAdmin();
      
      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }
}