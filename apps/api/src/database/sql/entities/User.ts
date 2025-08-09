import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from './Role';
import { Permission } from './Permission';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({
    unique: true
  })
  email!: string;

  @Column({select: false})
  password!: string;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt!: Date;

  // Many-to-many relationship with Roles
  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'role_user',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles!: Role[];

  // Many-to-many relationship with Permissions (direct permissions)
  @ManyToMany(() => Permission, permission => permission.users)
  @JoinTable({
    name: 'permission_user',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }
  })
  permissions!: Permission[];

  // Helper methods for ACL
  async hasRole(roleName: string): Promise<boolean> {
    const roles = await this.roles;
    return roles.some(role => role.name === roleName);
  }

  async hasPermission(permissionName: string): Promise<boolean> {
    // Check direct permissions first
    const directPermissions = await this.permissions;
    if (directPermissions && directPermissions.some(permission => permission.name === permissionName)) {
      return true;
    }

    // Check role-based permissions
    const roles = await this.roles;
    if (roles) {
      for (const role of roles) {
        const permissions = await role.permissions;
        if (permissions && permissions.some(permission => permission.name === permissionName)) {
          return true;
        }
      }
    }
    
    return false;
  }

  async hasAnyRole(roleNames: string[]): Promise<boolean> {
    const roles = await this.roles;
    return roles.some(role => roleNames.includes(role.name));
  }

  async hasAllRoles(roleNames: string[]): Promise<boolean> {
    const roles = await this.roles;
    const userRoleNames = roles.map(role => role.name);
    return roleNames.every(roleName => userRoleNames.includes(roleName));
  }

  async assignRole(roleName: string): Promise<void> {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    if (!this.roles) {
      this.roles = [];
    }
    
    const hasRole = this.roles.some(r => r.id === role.id);
    if (!hasRole) {
      this.roles.push(role);
      await this.save();
    }
  }

  async removeRole(roleName: string): Promise<void> {
    if (!this.roles) return;

    this.roles = this.roles.filter(role => role.name !== roleName);
    await this.save();
  }

  async syncRoles(roleNames: string[]): Promise<void> {
    const roles = await Role.find({
      where: roleNames.map(name => ({ name }))
    });

    this.roles = roles;
    await this.save();
  }

  async getRoleNames(): Promise<string[]> {
    const roles = await this.roles;
    return roles.map(role => role.name);
  }

  async getPermissionNames(): Promise<string[]> {
    const allPermissions: string[] = [];

    // Get direct permissions
    const directPermissions = await this.permissions;
    if (directPermissions) {
      allPermissions.push(...directPermissions.map(permission => permission.name));
    }

    // Get role-based permissions
    const roles = await this.roles;
    if (roles) {
      for (const role of roles) {
        const permissions = await role.permissions;
        if (permissions) {
          allPermissions.push(...permissions.map(permission => permission.name));
        }
      }
    }

    // Remove duplicates
    return [...new Set(allPermissions)];
  }

  // Direct permission management methods
  async assignPermission(permissionName: string): Promise<void> {
    const permission = await Permission.findOne({ where: { name: permissionName } });
    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }

    const currentPermissions = await this.permissions;
    if (!currentPermissions.some(p => p.id === permission.id)) {
      currentPermissions.push(permission);
      await this.save();
    }
  }

  async removePermission(permissionName: string): Promise<void> {
    const currentPermissions = await this.permissions;
    this.permissions = currentPermissions.filter(p => p.name !== permissionName);
    await this.save();
  }

  async assignAllPermissions(): Promise<void> {
    // Get all permissions
    const allPermissions = await Permission.find();
    
    // Get current permissions to avoid duplicates
    const currentPermissions = await this.permissions || [];
    const currentPermissionIds = new Set(currentPermissions.map(p => p.id));
    
    // Filter out permissions that are already assigned
    const newPermissions = allPermissions.filter(p => !currentPermissionIds.has(p.id));
    
    if (newPermissions.length > 0) {
      // Add only new permissions
      this.permissions = [...currentPermissions, ...newPermissions];
      await this.save();
    }
  }
}
