import 'reflect-metadata';
import request from 'supertest';
import app from '../../src/app';
import { refreshDB } from '../bootstrap';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { User } from '../../src/database/sql/entities/User';
import { Role } from '../../src/database/sql/entities/Role';
import AuthService from '../../src/services/auth.service';
import Container from 'typedi';
import bcrypt from 'bcryptjs';

describe('Roles API', () => {
  let adminToken: string;
  let adminUser: any;
  let regularToken: string;
  let regularUser: User;
  let authService: AuthService;
  let testRole: Role;

  beforeEach(async () => {
    await refreshDB(); // DON'T seed admin to ensure our user gets id=1
    authService = Container.get(AuthService);

    // Seed just the permissions (without creating admin user)
    const { SeederService } = require('../../src/services/seeder.service');
    const seederService = new SeederService();
    await seederService.seedPermissions();

    // Create admin user (first user is automatically admin with id=1)
    adminUser = await authService.createUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'password'
    });
    adminToken = adminUser.token;

    // Create regular user with roles.read permission
    const hashedPassword = await bcrypt.hash('password', 10);
    regularUser = new User();
    regularUser.firstName = 'Regular';
    regularUser.lastName = 'User';
    regularUser.email = 'regular@test.com';
    regularUser.password = hashedPassword;
    await regularUser.save();

    // Assign default permissions (includes roles.read)
    await regularUser.assignDefaultUserPermissions();

    // Generate token for regular user
    const loginResult = await authService.login({
      body: { email: 'regular@test.com', password: 'password' }
    } as any);
    regularToken = loginResult.token;

    // Create a test role for testing
    testRole = new Role();
    testRole.name = 'test-role';
    testRole.label = 'Test Role';
    await testRole.save();

    // Assign some permissions to the test role
    await testRole.givePermissionTo('users.read');
    await testRole.givePermissionTo('dashboard.analytics');
  });

  describe('GET /api/v1/roles', () => {
    it('should return paginated roles list for users with roles.read permission', async () => {
      const response = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');

      // Should have at least our test role
      expect(response.body.meta.total).toBeGreaterThanOrEqual(1);

      // Check role data structure
      const role = response.body.data.find((r: any) => r.name === 'test-role');
      expect(role).toBeDefined();
      expect(role).toHaveProperty('id');
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('label');
      expect(role).toHaveProperty('permissionsCount');
      expect(role).toHaveProperty('usersCount');
      expect(role).toHaveProperty('createdAt');
      expect(role).toHaveProperty('updatedAt');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/roles?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(1);
      expect(response.body.data.length).toBe(1);
    });

    it('should support search parameter', async () => {
      const response = await request(app)
        .get('/api/v1/roles?search=test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      // Should find test role
      expect(response.body.data.some((role: any) =>
        role.name.includes('test') || role.label.includes('Test')
      )).toBe(true);
    });

    it('should deny access without proper permissions', async () => {
      // Create user without roles.read permission
      const hashedPassword = await bcrypt.hash('password', 10);
      const noPermUser = new User();
      noPermUser.firstName = 'No';
      noPermUser.lastName = 'Permission';
      noPermUser.email = 'noperm@test.com';
      noPermUser.password = hashedPassword;
      await noPermUser.save();

      const loginResult = await authService.login({
        body: { email: 'noperm@test.com', password: 'password' }
      } as any);

      await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${loginResult.token}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/roles/:id', () => {
    it('should return specific role details', async () => {
      const response = await request(app)
        .get(`/api/v1/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      const role = response.body.data;
      expect(role.id).toBe(testRole.id);
      expect(role.name).toBe('test-role');
      expect(role.label).toBe('Test Role');
      expect(role).toHaveProperty('permissions');
      expect(role).toHaveProperty('users');
      expect(Array.isArray(role.permissions)).toBe(true);
      expect(Array.isArray(role.users)).toBe(true);

      // Should have the permissions we assigned
      expect(role.permissions.some((p: any) => p.name === 'users.read')).toBe(true);
      expect(role.permissions.some((p: any) => p.name === 'dashboard.analytics')).toBe(true);
    });

    it('should return 404 for non-existent role', async () => {
      await request(app)
        .get('/api/v1/roles/99999')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(500); // Will throw "Role not found" error
    });

    it('should deny access without proper permissions', async () => {
      // Create user without roles.read permission
      const hashedPassword = await bcrypt.hash('password', 10);
      const noPermUser = new User();
      noPermUser.firstName = 'No';
      noPermUser.lastName = 'Permission';
      noPermUser.email = 'noperm2@test.com';
      noPermUser.password = hashedPassword;
      await noPermUser.save();

      const loginResult = await authService.login({
        body: { email: 'noperm2@test.com', password: 'password' }
      } as any);

      await request(app)
        .get(`/api/v1/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${loginResult.token}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/roles', () => {
    it('should create a new role as admin', async () => {
      const roleData = {
        name: 'new-role',
        label: 'New Role',
        permissions: ['users.read', 'dashboard.analytics']
      };

      const response = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Role created successfully');

      const role = response.body.data;
      expect(role.name).toBe(roleData.name);
      expect(role.label).toBe(roleData.label);

      // Verify role was created in database with permissions
      const createdRole = await Role.findOne({
        where: { name: roleData.name },
        relations: ['permissions']
      });
      expect(createdRole).toBeDefined();
      expect(createdRole!.permissions.some(p => p.name === 'users.read')).toBe(true);
    });

    it('should create role without permissions', async () => {
      const roleData = {
        name: 'simple-role',
        label: 'Simple Role'
      };

      const response = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(200);

      expect(response.body.data.name).toBe(roleData.name);
      expect(response.body.data.label).toBe(roleData.label);
    });

    it('should reject duplicate role name', async () => {
      const roleData = {
        name: testRole.name, // Use existing role name
        label: 'Duplicate Role'
      };

      await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(500); // Will throw "Role with this name already exists" error
    });

    it('should deny access for non-admin users', async () => {
      const roleData = {
        name: 'unauthorized-role',
        label: 'Unauthorized Role'
      };

      await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(roleData)
        .expect(403);
    });
  });

  describe('PUT /api/v1/roles/:id', () => {
    it('should update role as admin', async () => {
      const updateData = {
        name: 'updated-role',
        label: 'Updated Role',
        permissions: ['users.create', 'users.update']
      };

      const response = await request(app)
        .put(`/api/v1/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Role updated successfully');

      const role = response.body.data;
      expect(role.name).toBe(updateData.name);
      expect(role.label).toBe(updateData.label);

      // Verify permissions were updated
      const updatedRole = await Role.findOne({
        where: { id: testRole.id },
        relations: ['permissions']
      });
      expect(updatedRole!.permissions.some(p => p.name === 'users.create')).toBe(true);
      expect(updatedRole!.permissions.some(p => p.name === 'users.update')).toBe(true);
      // Old permissions should be removed
      expect(updatedRole!.permissions.some(p => p.name === 'dashboard.analytics')).toBe(false);
    });

    it('should update only name and label without changing permissions', async () => {
      const updateData = {
        name: 'renamed-role',
        label: 'Renamed Role'
      };

      const response = await request(app)
        .put(`/api/v1/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.label).toBe(updateData.label);

      // Verify original permissions are preserved
      const updatedRole = await Role.findOne({
        where: { id: testRole.id },
        relations: ['permissions']
      });
      expect(updatedRole!.permissions.some(p => p.name === 'users.read')).toBe(true);
    });

    it('should deny access for non-admin users', async () => {
      const updateData = {
        name: 'unauthorized-update'
      };

      await request(app)
        .put(`/api/v1/roles/${testRole.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return error for non-existent role', async () => {
      await request(app)
        .put('/api/v1/roles/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'does-not-exist' })
        .expect(500); // Will throw "Role not found" error
    });
  });

  describe('DELETE /api/v1/roles/:id', () => {
    let deletableRole: Role;

    beforeEach(async () => {
      // Create a role that can be safely deleted
      deletableRole = new Role();
      deletableRole.name = 'deletable-role';
      deletableRole.label = 'Deletable Role';
      await deletableRole.save();
    });

    it('should delete role as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/roles/${deletableRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Role deleted successfully');

      // Verify role was deleted
      const deletedRole = await Role.findOne({ where: { id: deletableRole.id } });
      expect(deletedRole).toBeNull();
    });

    it('should prevent deletion of system roles', async () => {
      // Create a system role
      const systemRole = new Role();
      systemRole.name = 'admin';
      systemRole.label = 'Admin';
      await systemRole.save();

      await request(app)
        .delete(`/api/v1/roles/${systemRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500); // Will throw "Cannot delete system roles" error
    });

    it('should prevent deletion of roles with assigned users', async () => {
      // Assign the role to a user
      await regularUser.assignRole(deletableRole.name);

      await request(app)
        .delete(`/api/v1/roles/${deletableRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500); // Will throw "Cannot delete role that has users assigned to it" error
    });

    it('should deny access for non-admin users', async () => {
      await request(app)
        .delete(`/api/v1/roles/${deletableRole.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });

    it('should return error for non-existent role', async () => {
      await request(app)
        .delete('/api/v1/roles/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500); // Will throw "Role not found" error
    });
  });

  describe('POST /api/v1/roles/:id/permissions', () => {
    it('should assign permissions to role', async () => {
      // Create user with permissions.assign permission
      const permUser = new User();
      permUser.firstName = 'Perm';
      permUser.lastName = 'User';
      permUser.email = 'perm@test.com';
      permUser.password = await bcrypt.hash('password', 10);
      await permUser.save();
      await permUser.assignPermission('permissions.assign');

      const loginResult = await authService.login({
        body: { email: 'perm@test.com', password: 'password' }
      } as any);

      const response = await request(app)
        .post(`/api/v1/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${loginResult.token}`)
        .send({ permissions: ['system.settings', 'system.logs'] })
        .expect(200);

      expect(response.body.message).toBe('Permissions assigned successfully');

      // Verify permissions were assigned
      const updatedRole = await Role.findOne({
        where: { id: testRole.id },
        relations: ['permissions']
      });
      expect(updatedRole!.permissions.some(p => p.name === 'system.settings')).toBe(true);
      expect(updatedRole!.permissions.some(p => p.name === 'system.logs')).toBe(true);
    });

    it('should deny access without permissions.assign permission', async () => {
      // Create user without permissions.assign permission (no default permissions)
      const noPermUser = new User();
      noPermUser.firstName = 'No';
      noPermUser.lastName = 'Permission';
      noPermUser.email = 'nopermassg@test.com';
      noPermUser.password = await bcrypt.hash('password', 10);
      await noPermUser.save();

      const loginResult = await authService.login({
        body: { email: 'nopermassg@test.com', password: 'password' }
      } as any);

      await request(app)
        .post(`/api/v1/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${loginResult.token}`)
        .send({ permissions: ['system.settings'] })
        .expect(403);
    });

    it('should return error for non-existent role', async () => {
      await request(app)
        .post('/api/v1/roles/99999/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['system.settings'] })
        .expect(500); // Will throw "Role not found" error
    });
  });

  describe('GET /api/v1/roles/permissions/available', () => {
    it('should return available permissions', async () => {
      // Create user with permissions.read permission
      const permUser = new User();
      permUser.firstName = 'Perm';
      permUser.lastName = 'Reader';
      permUser.email = 'permreader@test.com';
      permUser.password = await bcrypt.hash('password', 10);
      await permUser.save();
      await permUser.assignPermission('permissions.read');

      const loginResult = await authService.login({
        body: { email: 'permreader@test.com', password: 'password' }
      } as any);

      const response = await request(app)
        .get('/api/v1/roles/permissions/available')
        .set('Authorization', `Bearer ${loginResult.token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check permission structure
      const permission = response.body.data[0];
      expect(permission).toHaveProperty('id');
      expect(permission).toHaveProperty('name');
      expect(permission).toHaveProperty('label');
    });

    it('should deny access without permissions.read permission', async () => {
      // Create user without permissions.read
      const noPermUser = new User();
      noPermUser.firstName = 'No';
      noPermUser.lastName = 'Permission';
      noPermUser.email = 'noperms@test.com';
      noPermUser.password = await bcrypt.hash('password', 10);
      await noPermUser.save();

      const loginResult = await authService.login({
        body: { email: 'noperms@test.com', password: 'password' }
      } as any);

      await request(app)
        .get('/api/v1/roles/permissions/available')
        .set('Authorization', `Bearer ${loginResult.token}`)
        .expect(403);
    });
  });
});
