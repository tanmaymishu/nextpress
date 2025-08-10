import { Service } from 'typedi';
import { redisClient } from '@/app';
import { User } from '@/database/sql/entities/User';

@Service()
export class PermissionCacheService {
  private readonly CACHE_TTL = 900; // 15 minutes
  private readonly KEY_PREFIX = 'user_permissions:';

  /**
   * Get user permissions from cache or database
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const cacheKey = `${this.KEY_PREFIX}${userId}`;

    try {
      // Try cache first
      const cachedPermissions = await redisClient.get(cacheKey);
      if (cachedPermissions) {
        return JSON.parse(cachedPermissions);
      }

      // Cache miss - fetch from database
      const permissions = await this.fetchUserPermissionsFromDB(userId);

      // Cache the result
      await redisClient.setex(cacheKey, this.CACHE_TTL, JSON.stringify(permissions));

      return permissions;
    } catch (error) {
      console.error('Permission cache error:', error);
      // Fallback to database on cache failure
      return this.fetchUserPermissionsFromDB(userId);
    }
  }

  /**
   * Invalidate user permissions cache
   * Call this when user permissions change
   */
  async invalidateUserPermissions(userId: number): Promise<void> {
    const cacheKey = `${this.KEY_PREFIX}${userId}`;
    try {
      await redisClient.del(cacheKey);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate permissions for multiple users
   * Useful when role permissions change
   */
  async invalidateUsersWithRole(roleId: number): Promise<void> {
    try {
      // Get all users with this role
      const users = await User.createQueryBuilder('user')
        .innerJoin('user.roles', 'role', 'role.id = :roleId', { roleId })
        .select('user.id')
        .getMany();

      // Invalidate cache for all affected users
      const invalidationPromises = users.map(user =>
        this.invalidateUserPermissions(user.id)
      );

      await Promise.all(invalidationPromises);
    } catch (error) {
      console.error('Bulk cache invalidation error:', error);
    }
  }

  /**
   * Warm up cache for a user (preload permissions)
   */
  async warmupUserCache(userId: number): Promise<void> {
    await this.getUserPermissions(userId);
  }

  /**
   * Fetch permissions from database
   */
  private async fetchUserPermissionsFromDB(userId: number): Promise<string[]> {
    const user = await User.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'permissions']
    });

    if (!user) {
      return [];
    }

    const permissions = new Set<string>();

    // Add direct permissions
    if (user.permissions) {
      user.permissions.forEach(permission => permissions.add(permission.name));
    }

    // Add role-based permissions
    if (user.roles) {
      user.roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(permission => permissions.add(permission.name));
        }
      });
    }

    return Array.from(permissions);
  }
}
