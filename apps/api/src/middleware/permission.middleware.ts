import { Request, Response, NextFunction } from 'express';
import { User } from '@/database/sql/entities/User';
import { Container } from 'typedi';
import { PermissionCacheService } from '@/services/permission-cache.service';

/**
 * Check if a user ID represents the admin (first user)
 */
export const isUserAdmin = (userId: number): boolean => {
  return userId === 1; // First user is always admin
};

/**
 * Middleware to require admin access (first user only)
 */
export const requireAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any; // JWT payload

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!isUserAdmin(user.id || user.sub)) {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('Admin check error:', error);
      return res.status(500).json({
        error: 'Admin check failed',
        code: 'ADMIN_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any; // JWT payload with permissions

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // 🚀 PERFORMANCE: Check permissions from JWT payload (no DB query!)
      const userPermissions: string[] = user.permissions || [];
      const hasPermission = userPermissions.includes(permissionName);
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Permission Check Debug:', {
          userId: user.id || user.sub,
          requiredPermission: permissionName,
          userPermissions: userPermissions.slice(0, 5), // Show first 5 permissions
          hasPermission,
          totalPermissions: userPermissions.length
        });
      }
      
      if (!hasPermission) {
        return res.status(403).json({
          error: `Permission '${permissionName}' required`,
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissionName,
          userPermissions: process.env.NODE_ENV === 'development' ? userPermissions : undefined
        });
      }

      // Continue with the request - no need to reload user from DB
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Legacy middleware for cases where we need full user object from database
 * Use sparingly - only when you actually need user relations
 */
export const requirePermissionWithUser = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // First check JWT permissions for quick rejection
      const userPermissions: string[] = user.permissions || [];
      const hasPermission = userPermissions.includes(permissionName);
      
      if (!hasPermission) {
        return res.status(403).json({
          error: `Permission '${permissionName}' required`,
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissionName
        });
      }

      // Only load from DB if permission check passes and we need full user object
      const userWithPermissions = await User.findOne({
        where: { id: user.sub },
        relations: ['roles', 'roles.permissions', 'permissions']
      });

      if (!userWithPermissions) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Attach full user object to request
      req.user = userWithPermissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * ENTERPRISE: Redis-cached permission middleware (best performance)
 * Falls back to JWT permissions if cache unavailable
 */
export const requirePermissionCached = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      let userPermissions: string[] = [];

      // Strategy 1: Try JWT permissions first (fastest)
      if (user.permissions && Array.isArray(user.permissions)) {
        userPermissions = user.permissions;
      } else {
        // Strategy 2: Fallback to Redis cache
        try {
          const cacheService = Container.get(PermissionCacheService);
          userPermissions = await cacheService.getUserPermissions(user.sub);
        } catch (error) {
          console.error('Cache fallback failed:', error);
          // Strategy 3: Ultimate fallback to database
          const dbUser = await User.findOne({
            where: { id: user.sub },
            relations: ['roles', 'roles.permissions', 'permissions']
          });
          userPermissions = await dbUser?.getPermissionNames() || [];
        }
      }

      const hasPermission = userPermissions.includes(permissionName);
      
      if (!hasPermission) {
        return res.status(403).json({
          error: `Permission '${permissionName}' required`,
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissionName,
          userPermissions: process.env.NODE_ENV === 'development' ? userPermissions : undefined
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const requireAnyPermission = (permissionNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userWithPermissions = await User.findOne({
        where: { id: user.id },
        relations: ['roles', 'roles.permissions', 'permissions']
      });

      if (!userWithPermissions) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user has any of the required permissions
      let hasAnyPermission = false;
      for (const permissionName of permissionNames) {
        if (await userWithPermissions.hasPermission(permissionName)) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        return res.status(403).json({
          error: `One of these permissions required: ${permissionNames.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissionNames
        });
      }

      req.user = userWithPermissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has a specific role
 */
export const requireRole = (roleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userWithPermissions = await User.findOne({
        where: { id: user.id },
        relations: ['roles', 'permissions']
      });

      if (!userWithPermissions) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const hasRole = await userWithPermissions.hasRole(roleName);

      if (!hasRole) {
        return res.status(403).json({
          error: `Role '${roleName}' required`,
          code: 'INSUFFICIENT_ROLE',
          required: roleName
        });
      }

      req.user = userWithPermissions;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        error: 'Role check failed',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user has any of the specified roles
 */
export const requireAnyRole = (roleNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const userWithPermissions = await User.findOne({
        where: { id: user.id },
        relations: ['roles', 'permissions']
      });

      if (!userWithPermissions) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const hasAnyRole = await userWithPermissions.hasAnyRole(roleNames);

      if (!hasAnyRole) {
        return res.status(403).json({
          error: `One of these roles required: ${roleNames.join(', ')}`,
          code: 'INSUFFICIENT_ROLE',
          required: roleNames
        });
      }

      req.user = userWithPermissions;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        error: 'Role check failed',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};
