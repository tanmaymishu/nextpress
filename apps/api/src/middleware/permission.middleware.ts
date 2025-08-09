import { Request, Response, NextFunction } from 'express';
import { User } from '@/database/sql/entities/User';

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;

      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Load user with roles, role permissions, and direct permissions
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

      // Check if user has the required permission (checks both direct and role-based permissions)
      const hasPermission = await userWithPermissions.hasPermission(permissionName);

      if (!hasPermission) {
        return res.status(403).json({
          error: `Permission '${permissionName}' required`,
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissionName
        });
      }

      // Attach user with permissions to request for use in controllers
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
