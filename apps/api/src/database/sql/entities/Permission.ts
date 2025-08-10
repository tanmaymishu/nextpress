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
import { User } from './User';

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

  // Many-to-many relationship with Users (direct permissions)
  @ManyToMany(() => User, user => user.permissions)
  users!: User[];

  // Helper method
  async belongsToRole(roleName: string): Promise<boolean> {
    const count = await Permission.getRepository()
      .createQueryBuilder("permission")
      .innerJoin("permission.roles", "role")
      .where("permission.id = :permissionId", { permissionId: this.id })
      .andWhere("role.name = :roleName", { roleName })
      .getCount();
      
    return count > 0;
  }

  // Static method to seed permissions
  static async seedPermissions(): Promise<void> {
    for (const permissionData of STATIC_PERMISSIONS) {
      // Check if permission already exists
      let permission = await Permission.findOne({
        where: { name: permissionData.name }
      });

      if (permission) {
        // Update existing permission if label has changed
        if (permission.label !== permissionData.label) {
          permission.label = permissionData.label;
          await permission.save();
        }
      } else {
        // Create new permission
        permission = new Permission();
        permission.name = permissionData.name;
        permission.label = permissionData.label;
        await permission.save();
      }
    }
  }
}