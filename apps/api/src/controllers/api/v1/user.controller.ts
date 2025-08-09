import { Request, Response } from 'express';
import { Controller, Get, Req, Res, UseBefore } from 'routing-controllers';
import { Service } from 'typedi';
import { User } from '@/database/sql/entities/User';
import auth from '@/middleware/auth.middleware';

@Service()
@Controller('/api/v1')
export class UserController {

  @Get('/me')
  @UseBefore(auth.api)
  async me(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = (req.user as any).id;
    
    // Load user with roles, role permissions, and direct permissions
    const userWithPermissions = await User.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'permissions']
    });

    if (!userWithPermissions) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json({
      id: userWithPermissions.id,
      firstName: userWithPermissions.firstName,
      lastName: userWithPermissions.lastName,
      email: userWithPermissions.email,
      directPermissions: userWithPermissions.permissions?.map(p => p.name) || [],
      roles: userWithPermissions.roles?.map(role => ({
        id: role.id,
        name: role.name,
        label: role.label,
        permissions: role.permissions?.map(p => p.name) || []
      })) || [],
      allPermissions: await userWithPermissions.getPermissionNames(),
      createdAt: userWithPermissions.createdAt,
      updatedAt: userWithPermissions.updatedAt
    });
  }
}
