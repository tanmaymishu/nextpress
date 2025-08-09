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

  // Helper methods for ACL
  async hasRole(roleName: string): Promise<boolean> {
    const roles = await this.roles;
    return roles.some(role => role.name === roleName);
  }

  async hasPermission(permissionName: string): Promise<boolean> {
    const roles = await this.roles;
    
    for (const role of roles) {
      const permissions = await role.permissions;
      if (permissions.some(permission => permission.name === permissionName)) {
        return true;
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
    const roles = await this.roles;
    const allPermissions: string[] = [];

    for (const role of roles) {
      const permissions = await role.permissions;
      allPermissions.push(...permissions.map(permission => permission.name));
    }

    // Remove duplicates
    return [...new Set(allPermissions)];
  }
}
