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

  /**
   * Virtual property - not stored in database but always available in API responses
   * Automatically calculated based on user ID and permissions
   */
  get isAdmin(): boolean {
    return this.id === 1;
  }

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
    // Use query builder to check both direct permissions and role-based permissions
    const count = await User.getRepository()
      .createQueryBuilder("user")
      .leftJoin("user.permissions", "directPermission")
      .leftJoin("user.roles", "role") 
      .leftJoin("role.permissions", "rolePermission")
      .where("user.id = :userId", { userId: this.id })
      .andWhere(
        "(directPermission.name = :permissionName OR rolePermission.name = :permissionName)",
        { permissionName }
      )
      .getCount();
      
    return count > 0;
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
    const userWithRoles = await User.findOne({
      where: { id: this.id },
      relations: ['roles']
    });
    
    if (!userWithRoles || !userWithRoles.roles) {
      return [];
    }
    
    return userWithRoles.roles.map(role => role.name);
  }

  async getPermissionNames(): Promise<string[]> {
    // Get direct permissions
    const directPermissions = await User.getRepository()
      .createQueryBuilder("user")
      .leftJoin("user.permissions", "permission")
      .select("permission.name", "name")
      .where("user.id = :userId", { userId: this.id })
      .andWhere("permission.name IS NOT NULL")
      .getRawMany();

    // Get role-based permissions
    const rolePermissions = await User.getRepository()
      .createQueryBuilder("user")
      .leftJoin("user.roles", "role")
      .leftJoin("role.permissions", "permission")
      .select("permission.name", "name")
      .where("user.id = :userId", { userId: this.id })
      .andWhere("permission.name IS NOT NULL")
      .getRawMany();

    // Combine and deduplicate permission names
    const allPermissionNames = new Set<string>();
    
    directPermissions.forEach(row => {
      if (row.name) {
        allPermissionNames.add(row.name);
      }
    });

    rolePermissions.forEach(row => {
      if (row.name) {
        allPermissionNames.add(row.name);
      }
    });

    return Array.from(allPermissionNames);
  }

  // Direct permission management methods
  async assignPermission(permissionName: string): Promise<void> {
    const permission = await Permission.findOne({ where: { name: permissionName } });
    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }

    // Load the user with its permissions relationship
    const userWithPermissions = await User.findOne({
      where: { id: this.id },
      relations: ['permissions']
    });
    
    if (!userWithPermissions) {
      throw new Error('User not found');
    }

    // Check if permission is already assigned
    if (!userWithPermissions.permissions.some(p => p.id === permission.id)) {
      userWithPermissions.permissions.push(permission);
      await userWithPermissions.save();
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

  /**
   * Assign default permissions for new users (all permissions except admin-only ones)
   */
  async assignDefaultUserPermissions(): Promise<void> {
    // Get all permissions except admin-only ones
    const allPermissions = await Permission.find();
    const restrictedPermissions = [
      'users.create', 'users.update', 'users.delete',
      'roles.create', 'roles.update', 'roles.delete'
    ];
    const allowedPermissions = allPermissions.filter(p => !restrictedPermissions.includes(p.name));
    
    // Get current permissions to avoid duplicates
    const currentPermissions = await this.permissions || [];
    const currentPermissionIds = new Set(currentPermissions.map(p => p.id));
    
    // Filter out permissions that are already assigned
    const newPermissions = allowedPermissions.filter(p => !currentPermissionIds.has(p.id));
    
    if (newPermissions.length > 0) {
      this.permissions = [...currentPermissions, ...newPermissions];
      await this.save();
    }
  }

  /**
   * Check if this user is the first user (admin) based on lowest ID
   */
  isFirstUser(): boolean {
    return this.id === 1;
  }

  /**
   * Check if this user is admin (async version for complex permission checks)
   */
  async isAdminAdvanced(): Promise<boolean> {
    // Method 1: First user is always admin
    if (this.isFirstUser()) {
      return true;
    }

    // Method 2: Check if user has admin-level permissions
    const userPermissions = await this.getPermissionNames();
    const adminPermissions = ['users.update', 'users.delete'];
    return adminPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Static method to find the first user (admin)
   */
  static async findFirstUser(): Promise<User | null> {
    return await User.findOne({
      where: {},
      order: { id: 'ASC' },
      relations: ['roles', 'roles.permissions', 'permissions']
    });
  }

  /**
   * Static method to check if this is the first user being created
   */
  static async isFirstUserCreation(): Promise<boolean> {
    const userCount = await User.count();
    return userCount === 0;
  }
}
