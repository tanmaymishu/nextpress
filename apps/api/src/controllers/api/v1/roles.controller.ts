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
import { Container, Service } from 'typedi';
import { Role } from '../../../database/sql/entities/Role';
import { Permission } from '../../../database/sql/entities/Permission';
import auth from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';

interface CreateRoleRequest {
  name: string;
  label?: string;
  permissions?: string[];
}

interface UpdateRoleRequest {
  name?: string;
  label?: string;
  permissions?: string[];
}

interface AssignPermissionsRequest {
  permissions: string[];
}

@Service()
@JsonController('/api/v1/roles')
export class RolesV1Controller {

  @Get('/')
  @UseBefore(...auth.permission('roles.read'))
  async getRoles(
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10,
    @QueryParam('search') search?: string
  ) {
    const take = Math.min(limit, 100); // Max 100 per page
    const skip = (page - 1) * take;

    const queryBuilder = Role.createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .leftJoinAndSelect('role.users', 'users');

    if (search) {
      queryBuilder.where('role.name LIKE :search OR role.label LIKE :search', {
        search: `%${search}%`
      });
    }

    const [roles, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data: roles.map(role => ({
        id: role.id,
        name: role.name,
        label: role.label,
        permissionsCount: role.permissions?.length || 0,
        usersCount: role.users?.length || 0,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
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
  @UseBefore(...auth.permission('roles.read'))
  async getRole(@Param('id') id: number) {
    const role = await Role.findOne({
      where: { id },
      relations: ['permissions', 'users']
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return {
      data: {
        id: role.id,
        name: role.name,
        label: role.label,
        permissions: role.permissions.map(p => ({
          id: p.id,
          name: p.name,
          label: p.label
        })),
        users: role.users.map(u => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }
    };
  }

  @Post('/')
  @UseBefore(...auth.permission('roles.create'))
  async createRole(@Body() body: CreateRoleRequest) {
    const existingRole = await Role.findOne({ where: { name: body.name } });
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    const role = new Role();
    role.name = body.name;
    role.label = body.label;

    await role.save();

    // Assign permissions if provided
    if (body.permissions && body.permissions.length > 0) {
      await role.syncPermissions(body.permissions);
    }

    return {
      data: {
        id: role.id,
        name: role.name,
        label: role.label,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      },
      message: 'Role created successfully'
    };
  }

  @Put('/:id')
  @UseBefore(...auth.permission('roles.update'))
  async updateRole(@Param('id') id: number, @Body() body: UpdateRoleRequest) {
    const role = await Role.findOne({ where: { id } });
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if name is being changed and if it conflicts
    if (body.name && body.name !== role.name) {
      const existingRole = await Role.findOne({ where: { name: body.name } });
      if (existingRole) {
        throw new Error('Role with this name already exists');
      }
      role.name = body.name;
    }

    if (body.label !== undefined) {
      role.label = body.label;
    }

    await role.save();

    // Update permissions if provided
    if (body.permissions) {
      await role.syncPermissions(body.permissions);
    }

    return {
      data: {
        id: role.id,
        name: role.name,
        label: role.label,
        updatedAt: role.updatedAt
      },
      message: 'Role updated successfully'
    };
  }

  @Delete('/:id')
  @UseBefore(...auth.permission('roles.delete'))
  async deleteRole(@Param('id') id: number) {
    const role = await Role.findOne({
      where: { id },
      relations: ['users']
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Prevent deletion of roles that have users assigned
    if (role.users && role.users.length > 0) {
      throw new Error('Cannot delete role that has users assigned to it');
    }

    // Prevent deletion of system roles
    if (['admin', 'user', 'moderator'].includes(role.name)) {
      throw new Error('Cannot delete system roles');
    }

    await role.remove();

    return {
      message: 'Role deleted successfully'
    };
  }

  @Post('/:id/permissions')
  @UseBefore(...auth.permission('permissions.assign'))
  async assignPermissions(@Param('id') id: number, @Body() body: AssignPermissionsRequest) {
    const role = await Role.findOne({ where: { id } });
    if (!role) {
      throw new Error('Role not found');
    }

    await role.syncPermissions(body.permissions);

    return {
      message: 'Permissions assigned successfully'
    };
  }

  @Get('/permissions/available')
  @UseBefore(...auth.permission('permissions.read'))
  async getAvailablePermissions() {
    const permissions = await Permission.find();

    return {
      data: permissions.map(p => ({
        id: p.id,
        name: p.name,
        label: p.label
      }))
    };
  }
}
