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
    const permissions = await this.permissions;
    return permissions.some(permission => permission.name === permissionName);
  }

  async givePermissionTo(permissionName: string): Promise<void> {
    const permission = await Permission.findOne({ where: { name: permissionName } });
    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }

    if (!this.permissions) {
      this.permissions = [];
    }
    
    const hasPermission = this.permissions.some(p => p.id === permission.id);
    if (!hasPermission) {
      this.permissions.push(permission);
      await this.save();
    }
  }

  async removePermission(permissionName: string): Promise<void> {
    if (!this.permissions) return;

    this.permissions = this.permissions.filter(permission => permission.name !== permissionName);
    await this.save();
  }

  async syncPermissions(permissionNames: string[]): Promise<void> {
    const permissions = await Permission.find({
      where: permissionNames.map(name => ({ name }))
    });

    this.permissions = permissions;
    await this.save();
  }
}