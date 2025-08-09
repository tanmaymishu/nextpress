import {
  JsonController,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseBefore,
  Req,
  Res,
  QueryParam
} from 'routing-controllers';
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { User } from '../../../database/sql/entities/User';
import { Role } from '../../../database/sql/entities/Role';
import auth from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles?: string[];
}

interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roles?: string[];
}

interface AssignRolesRequest {
  roles: string[];
}

@JsonController('/api/v1/users')
export class UsersV1Controller {

  @Get('/')
  @UseBefore(auth.api)
  @UseBefore(requirePermission('users.read'))
  async getUsers(
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10,
    @QueryParam('search') search?: string,
    @QueryParam('role') roleFilter?: string
  ) {
    const take = Math.min(limit, 100); // Max 100 per page
    const skip = (page - 1) * take;

    const queryBuilder = User.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions');

    if (search) {
      queryBuilder.where(
        'user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search',
        { search: `%${search}%` }
      );
    }

    if (roleFilter) {
      queryBuilder.andWhere('roles.name = :role', { role: roleFilter });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data: users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name,
          label: role.label
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  @Get('/:id')
  @UseBefore(auth.api)
  @UseBefore(requirePermission('users.read'))
  async getUser(@Param('id') id: number) {
    const user = await User.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions']
    });

    if (!user) {
      throw new Error('User not found');
    }

    const permissions = await user.getPermissionNames();

    return {
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name,
          label: role.label,
          permissions: role.permissions.map(p => ({
            id: p.id,
            name: p.name,
            label: p.label
          }))
        })),
        permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  }

  @Post('/')
  @UseBefore(auth.api)
  @UseBefore(requirePermission('users.create'))
  async createUser(@Body() body: CreateUserRequest) {
    const existingUser = await User.findOne({ where: { email: body.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = new User();
    user.firstName = body.firstName;
    user.lastName = body.lastName;
    user.email = body.email;
    user.password = hashedPassword;
    
    await user.save();

    // Assign roles if provided
    if (body.roles && body.roles.length > 0) {
      await user.syncRoles(body.roles);
    } else {
      // Assign default 'user' role
      await user.assignRole('user');
    }

    // Reload with relations
    const createdUser = await User.findOne({
      where: { id: user.id },
      relations: ['roles']
    });

    return {
      data: {
        id: createdUser!.id,
        firstName: createdUser!.firstName,
        lastName: createdUser!.lastName,
        email: createdUser!.email,
        roles: createdUser!.roles.map(role => ({
          id: role.id,
          name: role.name,
          label: role.label
        })),
        createdAt: createdUser!.createdAt,
        updatedAt: createdUser!.updatedAt
      },
      message: 'User created successfully'
    };
  }

  @Put('/:id')
  @UseBefore(auth.api)
  @UseBefore(requirePermission('users.update'))
  async updateUser(@Param('id') id: number, @Body() body: UpdateUserRequest, @Req() req: Request) {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent non-admin users from updating other users
    const currentUser = req.user as User;
    const isAdmin = await currentUser.hasRole('admin');
    if (!isAdmin && currentUser.id !== user.id) {
      throw new Error('You can only update your own profile');
    }

    // Check if email is being changed and if it conflicts
    if (body.email && body.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: body.email } });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      user.email = body.email;
    }

    if (body.firstName) user.firstName = body.firstName;
    if (body.lastName) user.lastName = body.lastName;

    if (body.password) {
      user.password = await bcrypt.hash(body.password, 10);
    }

    await user.save();

    // Update roles if provided and user has permission
    if (body.roles && isAdmin) {
      await user.syncRoles(body.roles);
    }

    // Reload with relations
    const updatedUser = await User.findOne({
      where: { id: user.id },
      relations: ['roles']
    });

    return {
      data: {
        id: updatedUser!.id,
        firstName: updatedUser!.firstName,
        lastName: updatedUser!.lastName,
        email: updatedUser!.email,
        roles: updatedUser!.roles.map(role => ({
          id: role.id,
          name: role.name,
          label: role.label
        })),
        updatedAt: updatedUser!.updatedAt
      },
      message: 'User updated successfully'
    };
  }

  @Delete('/:id')
  @UseBefore(auth.api)
  @UseBefore(requirePermission('users.delete'))
  async deleteUser(@Param('id') id: number, @Req() req: Request) {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    const currentUser = req.user as User;
    
    // Prevent self-deletion
    if (currentUser.id === user.id) {
      throw new Error('You cannot delete your own account');
    }

    // Prevent deletion of admin users by non-super-admin
    const userIsAdmin = await user.hasRole('admin');
    const currentUserIsAdmin = await currentUser.hasRole('admin');
    
    if (userIsAdmin && !currentUserIsAdmin) {
      throw new Error('Only administrators can delete admin users');
    }

    await user.remove();

    return {
      message: 'User deleted successfully'
    };
  }

  @Post('/:id/roles')
  @UseBefore(auth.api)
  @UseBefore(requirePermission('users.update'))
  async assignRoles(@Param('id') id: number, @Body() body: AssignRolesRequest) {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    await user.syncRoles(body.roles);

    return {
      message: 'Roles assigned successfully'
    };
  }

  @Get('/:id/permissions')
  @UseBefore(auth.api)
  @UseBefore(requirePermission('users.read'))
  async getUserPermissions(@Param('id') id: number) {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    const permissions = await user.getPermissionNames();
    const roles = await user.getRoleNames();

    return {
      data: {
        userId: user.id,
        roles,
        permissions
      }
    };
  }

  @Get('/roles/available')
  @UseBefore(auth.api)
  @UseBefore(requirePermission('roles.read'))
  async getAvailableRoles() {
    const roles = await Role.find();
    
    return {
      data: roles.map(role => ({
        id: role.id,
        name: role.name,
        label: role.label
      }))
    };
  }
}