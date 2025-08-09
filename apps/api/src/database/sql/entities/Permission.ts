import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToMany
} from 'typeorm';
import { Role } from './Role';

// Static permissions array - updated automatically on startup
export const STATIC_PERMISSIONS = [
  // User management
  { name: 'users.create', label: 'Create Users' },
  { name: 'users.read', label: 'View Users' },
  { name: 'users.update', label: 'Update Users' },
  { name: 'users.delete', label: 'Delete Users' },
  
  // Role management
  { name: 'roles.create', label: 'Create Roles' },
  { name: 'roles.read', label: 'View Roles' },
  { name: 'roles.update', label: 'Update Roles' },
  { name: 'roles.delete', label: 'Delete Roles' },
  
  // Permission management
  { name: 'permissions.read', label: 'View Permissions' },
  { name: 'permissions.assign', label: 'Assign Permissions' },
  
  // Dashboard access
  { name: 'dashboard.admin', label: 'Access Admin Dashboard' },
  { name: 'dashboard.analytics', label: 'View Analytics' },
  
  // System management
  { name: 'system.settings', label: 'Manage System Settings' },
  { name: 'system.logs', label: 'View System Logs' },
] as const;

@Entity('permissions')
export class Permission extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  label?: string;

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
  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[];

  // Helper method
  async belongsToRole(roleName: string): Promise<boolean> {
    const roles = await this.roles;
    return roles.some(role => role.name === roleName);
  }

  // Static method to seed permissions
  static async seedPermissions(): Promise<void> {
    const permissionRepository = Permission.getRepository();

    for (const permissionData of STATIC_PERMISSIONS) {
      await permissionRepository.upsert(
        {
          name: permissionData.name,
          label: permissionData.label
        },
        ['name'] // Conflict target
      );
    }
  }
}