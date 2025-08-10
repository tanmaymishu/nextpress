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
import { User } from './User';
import { Permission } from './Permission';

@Entity('roles')
export class Role extends BaseEntity {
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

  // Many-to-many relationship with Users
  @ManyToMany(() => User, user => user.roles)
  users!: User[];

  // Many-to-many relationship with Permissions
  @ManyToMany(() => Permission, permission => permission.roles)
  @JoinTable({
    name: 'permission_role',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }
  })
  permissions!: Permission[];

  // Helper methods
  async hasPermission(permissionName: string): Promise<boolean> {
    const count = await Role.getRepository()
      .createQueryBuilder("role")
      .innerJoin("role.permissions", "permission")
      .where("role.id = :roleId", { roleId: this.id })
      .andWhere("permission.name = :permissionName", { permissionName })
      .getCount();
      
    return count > 0;
  }

  async givePermissionTo(permissionName: string): Promise<void> {
    const permission = await Permission.findOne({ where: { name: permissionName } });
    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }

    // Load the role with its permissions relationship
    const roleWithPermissions = await Role.findOne({
      where: { id: this.id },
      relations: ['permissions']
    });
    
    if (!roleWithPermissions) {
      throw new Error('Role not found');
    }

    // Check if permission is already assigned
    const hasPermission = roleWithPermissions.permissions.some(p => p.id === permission.id);
    if (!hasPermission) {
      roleWithPermissions.permissions.push(permission);
      await roleWithPermissions.save();
    }
  }

  async removePermission(permissionName: string): Promise<void> {
    // Load the role with its permissions relationship
    const roleWithPermissions = await Role.findOne({
      where: { id: this.id },
      relations: ['permissions']
    });
    
    if (!roleWithPermissions || !roleWithPermissions.permissions) {
      return;
    }

    // Filter out the permission to remove
    roleWithPermissions.permissions = roleWithPermissions.permissions.filter(
      permission => permission.name !== permissionName
    );
    
    await roleWithPermissions.save();
  }

  async syncPermissions(permissionNames: string[]): Promise<void> {
    const permissions = await Permission.find({
      where: permissionNames.map(name => ({ name }))
    });

    this.permissions = permissions;
    await this.save();
  }
}