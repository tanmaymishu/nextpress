import 'reflect-metadata';
import { User } from '../../src/database/sql/entities/User';
import { Role } from '../../src/database/sql/entities/Role';
import { Permission } from '../../src/database/sql/entities/Permission';
import { SeederService } from '../../src/services/seeder.service';
import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals'
import { refreshDB } from '../bootstrap';
import bcrypt from 'bcryptjs';

describe('ACL System', () => {
  let seederService = new SeederService();

  beforeAll(async () => {
    await refreshDB();
  });

  describe('Permission Entity', () => {
    it('should seed permissions correctly', async () => {
      await seederService.seedPermissions();
      const permissions = await Permission.find();
      expect(permissions.length).toBeGreaterThan(0);

      const userCreatePermission = permissions.find(p => p.name === 'users.create');
      expect(userCreatePermission).toBeDefined();
      expect(userCreatePermission?.label).toBe('Create Users');
    });

    it('should check if permission belongs to role', async () => {
      const permission = await Permission.findOne({ where: { name: 'users.create' } });
      expect(permission).toBeDefined();

      // Create test role and assign permission
      const testRole = new Role();
      testRole.name = 'test-role';
      testRole.label = 'Test Role';
      await testRole.save();

      await testRole.givePermissionTo('users.create');
      await testRole.save();

      const belongsToRole = await permission!.belongsToRole('test-role');
      expect(belongsToRole).toBe(true);

      const doesNotBelongToRole = await permission!.belongsToRole('non-existent-role');
      expect(doesNotBelongToRole).toBe(false);
    });
  });

  describe('Role Entity', () => {
    let testRole: Role;

    beforeEach(async () => {
      testRole = new Role();
      testRole.name = 'test-role-' + Date.now();
      testRole.label = 'Test Role';
      await testRole.save();
    });

    it('should give permission to role', async () => {
      await testRole.givePermissionTo('users.create');

      const hasPermission = await testRole.hasPermission('users.create');
      expect(hasPermission).toBe(true);
    });

    it('should not duplicate permissions', async () => {
      await testRole.givePermissionTo('users.create');
      await testRole.givePermissionTo('users.create'); // Try to add again

      const roleWithPermissions = await Role.findOne({
        where: { id: testRole.id },
        relations: ['permissions']
      });

      const userCreatePermissions = roleWithPermissions!.permissions.filter(
        p => p.name === 'users.create'
      );
      expect(userCreatePermissions).toHaveLength(1);
    });

    it('should remove permission from role', async () => {
      await testRole.givePermissionTo('users.create');
      let hasPermission = await testRole.hasPermission('users.create');
      expect(hasPermission).toBe(true);

      await testRole.removePermission('users.create');
      hasPermission = await testRole.hasPermission('users.create');
      expect(hasPermission).toBe(false);
    });

    it('should sync permissions correctly', async () => {
      await testRole.syncPermissions(['users.create', 'users.read', 'users.update']);

      const hasCreate = await testRole.hasPermission('users.create');
      const hasRead = await testRole.hasPermission('users.read');
      const hasUpdate = await testRole.hasPermission('users.update');
      const hasDelete = await testRole.hasPermission('users.delete');

      expect(hasCreate).toBe(true);
      expect(hasRead).toBe(true);
      expect(hasUpdate).toBe(true);
      expect(hasDelete).toBe(false);
    });

    it('should throw error for non-existent permission', async () => {
      await expect(
        testRole.givePermissionTo('non.existent.permission')
      ).rejects.toThrow("Permission 'non.existent.permission' not found");
    });
  });

  describe('User Entity', () => {
    let testUser: User;
    let testRole: Role;


    beforeEach(async () => {
      await seederService.seedPermissions();
      const hashedPassword = await bcrypt.hash('testpassword', 10);

      testUser = new User();
      testUser.firstName = 'Test';
      testUser.lastName = 'User';
      testUser.email = `test-${Date.now()}@example.com`;
      testUser.password = hashedPassword;
      await testUser.save();

      testRole = new Role();
      testRole.name = 'test-role-' + Date.now();
      testRole.label = 'Test Role';
      await testRole.save();

      await testRole.givePermissionTo('users.create');
      await testRole.givePermissionTo('users.read');
    });

    it('should assign role to user', async () => {
      await testUser.assignRole(testRole.name);

      const hasRole = await testUser.hasRole(testRole.name);
      expect(hasRole).toBe(true);
    });

    it('should not duplicate roles', async () => {
      await testUser.assignRole(testRole.name);
      await testUser.assignRole(testRole.name); // Try to add again

      const userWithRoles = await User.findOne({
        where: { id: testUser.id },
        relations: ['roles']
      });

      const matchingRoles = userWithRoles!.roles.filter(r => r.name === testRole.name);
      expect(matchingRoles).toHaveLength(1);
    });

    it('should check user permissions through roles', async () => {
      await testUser.assignRole(testRole.name);

      const hasCreatePermission = await testUser.hasPermission('users.create');
      const hasReadPermission = await testUser.hasPermission('users.read');
      const hasDeletePermission = await testUser.hasPermission('users.delete');

      expect(hasCreatePermission).toBe(true);
      expect(hasReadPermission).toBe(true);
      expect(hasDeletePermission).toBe(false);
    });

    it('should remove role from user', async () => {
      await testUser.assignRole(testRole.name);
      let hasRole = await testUser.hasRole(testRole.name);
      expect(hasRole).toBe(true);

      await testUser.removeRole(testRole.name);
      hasRole = await testUser.hasRole(testRole.name);
      expect(hasRole).toBe(false);
    });

    it('should check for any roles', async () => {
      const role1 = new Role();
      role1.name = 'role1-' + Date.now();
      await role1.save();

      const role2 = new Role();
      role2.name = 'role2-' + Date.now();
      await role2.save();

      await testUser.assignRole(role1.name);

      const hasAnyRole = await testUser.hasAnyRole([role1.name, role2.name]);
      const hasNoRole = await testUser.hasAnyRole(['non-existent-role']);

      expect(hasAnyRole).toBe(true);
      expect(hasNoRole).toBe(false);
    });

    it('should check for all roles', async () => {
      const role1 = new Role();
      role1.name = 'role1-' + Date.now();
      await role1.save();

      const role2 = new Role();
      role2.name = 'role2-' + Date.now();
      await role2.save();

      await testUser.assignRole(role1.name);
      await testUser.assignRole(role2.name);

      const hasAllRoles = await testUser.hasAllRoles([role1.name, role2.name]);
      const hasNotAllRoles = await testUser.hasAllRoles([role1.name, 'non-existent-role']);

      expect(hasAllRoles).toBe(true);
      expect(hasNotAllRoles).toBe(false);
    });

    it('should sync roles correctly', async () => {
      const role1 = new Role();
      role1.name = 'role1-' + Date.now();
      await role1.save();

      const role2 = new Role();
      role2.name = 'role2-' + Date.now();
      await role2.save();

      const role3 = new Role();
      role3.name = 'role3-' + Date.now();
      await role3.save();

      // First assign role1 and role2
      await testUser.assignRole(role1.name);
      await testUser.assignRole(role2.name);

      // Sync to only role2 and role3
      await testUser.syncRoles([role2.name, role3.name]);

      const hasRole1 = await testUser.hasRole(role1.name);
      const hasRole2 = await testUser.hasRole(role2.name);
      const hasRole3 = await testUser.hasRole(role3.name);

      expect(hasRole1).toBe(false); // Should be removed
      expect(hasRole2).toBe(true);  // Should remain
      expect(hasRole3).toBe(true);  // Should be added
    });

    it('should get role names', async () => {
      const role1 = new Role();
      role1.name = 'role1-' + Date.now();
      await role1.save();

      const role2 = new Role();
      role2.name = 'role2-' + Date.now();
      await role2.save();

      await testUser.assignRole(role1.name);
      await testUser.assignRole(role2.name);

      const roleNames = await testUser.getRoleNames();
      expect(roleNames).toContain(role1.name);
      expect(roleNames).toContain(role2.name);
      expect(roleNames).toHaveLength(2);
    });

    it('should get permission names', async () => {
      await testUser.assignRole(testRole.name);

      const permissionNames = await testUser.getPermissionNames();
      expect(permissionNames).toContain('users.create');
      expect(permissionNames).toContain('users.read');
      expect(permissionNames).not.toContain('users.delete');
    });

    it('should throw error for non-existent role', async () => {
      await expect(
        testUser.assignRole('non-existent-role')
      ).rejects.toThrow("Role 'non-existent-role' not found");
    });
  });

  describe('SeederService', () => {
    it('should seed permissions without errors', async () => {
      await expect(seederService.seedPermissions()).resolves.not.toThrow();
    });

    it('should seed role permissions without errors', async () => {
      // First ensure we have default roles
      const adminRole = new Role();
      adminRole.name = 'admin';
      adminRole.label = 'Administrator';
      await adminRole.save();

      const userRole = new Role();
      userRole.name = 'user';
      userRole.label = 'Regular User';
      await userRole.save();

      const moderatorRole = new Role();
      moderatorRole.name = 'moderator';
      moderatorRole.label = 'Moderator';
      await moderatorRole.save();

      await expect(seederService.seedPermissions()).resolves.not.toThrow();

      // Check if permissions exist after seeding
      const permissionCount = await Permission.count();
      expect(permissionCount).toBeGreaterThan(0);

      // Assign some permissions to admin role
      await adminRole.givePermissionTo('users.create');
      await adminRole.givePermissionTo('users.read');
      await adminRole.givePermissionTo('dashboard.admin');

      // Verify admin has permissions
      const adminWithPermissions = await Role.findOne({
        where: { name: 'admin' },
        relations: ['permissions']
      });

      expect(adminWithPermissions!.permissions.length).toBeGreaterThan(0);
    });
  });
});
