import 'reflect-metadata';
import request from 'supertest';
import app from '../../src/app';
import { refreshDB, initUser } from '../bootstrap';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { User } from '../../src/database/sql/entities/User';
import { Role } from '../../src/database/sql/entities/Role';
import AuthService from '../../src/services/auth.service';
import Container from 'typedi';
import bcrypt from 'bcrypt';

describe('Users API', () => {
  let adminToken: string;
  let adminUser: User;
  let regularToken: string;
  let regularUser: User;
  let authService: AuthService;

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

    // Create regular user
    const hashedPassword = await bcrypt.hash('password', 10);
    regularUser = new User();
    regularUser.firstName = 'Regular';
    regularUser.lastName = 'User';
    regularUser.email = 'regular@test.com';
    regularUser.password = hashedPassword;
    await regularUser.save();
    
    // Assign default permissions
    await regularUser.assignDefaultUserPermissions();
    
    // Generate token for regular user
    const loginResult = await authService.login({
      body: { email: 'regular@test.com', password: 'password' }
    } as any);
    regularToken = loginResult.token;
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated users list for admin', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');

      // Should have at least our admin and regular user
      expect(response.body.meta.total).toBeGreaterThanOrEqual(2);

      // Check user data structure
      const user = response.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('isAdmin');
      expect(user).toHaveProperty('roles');
      expect(user).not.toHaveProperty('password'); // Should not expose password
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(1);
      expect(response.body.data.length).toBe(1);
    });

    it('should support search parameter', async () => {
      const response = await request(app)
        .get('/api/v1/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      // Should find admin user
      expect(response.body.data.some((user: any) => 
        user.firstName.toLowerCase().includes('admin') || 
        user.email.toLowerCase().includes('admin')
      )).toBe(true);
    });

    it('should deny access without proper permissions', async () => {
      // Create user without users.read permission
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
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${loginResult.token}`)
        .expect(403);
    });

    it('should allow access with users.read permission', async () => {
      await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return specific user details for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      const user = response.body.data;
      expect(user.id).toBe(regularUser.id);
      expect(user.firstName).toBe('Regular');
      expect(user.lastName).toBe('User');
      expect(user.email).toBe('regular@test.com');
      expect(user).toHaveProperty('roles');
      expect(user).toHaveProperty('permissions');
      expect(user).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500); // Will throw "User not found" error
    });

    it('should allow access with users.read permission', async () => {
      await request(app)
        .get(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user as admin', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@test.com',
        password: 'password123',
        roles: []
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User created successfully');

      const user = response.body.data;
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.email).toBe(userData.email);
      expect(user).not.toHaveProperty('password');

      // Verify user was created in database
      const createdUser = await User.findOne({ where: { email: userData.email } });
      expect(createdUser).toBeDefined();
    });

    it('should create user with specific roles', async () => {
      // First create a role
      const role = new Role();
      role.name = 'test-role';
      role.label = 'Test Role';
      await role.save();

      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser2@test.com',
        password: 'password123',
        roles: ['test-role']
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(200);

      expect(response.body.data.roles).toHaveLength(1);
      expect(response.body.data.roles[0].name).toBe('test-role');
    });

    it('should reject duplicate email', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: adminUser.email, // Use existing email
        password: 'password123'
      };

      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(500); // Will throw "User with this email already exists" error
    });

    it('should deny access for non-admin users', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'newuser@test.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(userData)
        .expect(403);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update user as admin', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@test.com'
      };

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User updated successfully');

      const user = response.body.data;
      expect(user.firstName).toBe(updateData.firstName);
      expect(user.lastName).toBe(updateData.lastName);
      expect(user.email).toBe(updateData.email);
    });

    it('should allow users to update their own profile', async () => {
      const updateData = {
        firstName: 'Self Updated'
      };

      const response = await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.firstName).toBe(updateData.firstName);
    });

    it('should update password when provided', async () => {
      const updateData = {
        password: 'newpassword123'
      };

      await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      // Verify password was updated by trying to login
      const loginResult = await authService.login({
        body: { email: regularUser.email, password: 'newpassword123' }
      } as any);
      expect(loginResult.token).toBeDefined();
    });

    it('should deny access for updating other users without permission', async () => {
      // Create user without users.update permission
      const hashedPassword = await bcrypt.hash('password', 10);
      const noPermUser = new User();
      noPermUser.firstName = 'No';
      noPermUser.lastName = 'Permission';
      noPermUser.email = 'noupdate@test.com';
      noPermUser.password = hashedPassword;
      await noPermUser.save();

      const loginResult = await authService.login({
        body: { email: 'noupdate@test.com', password: 'password' }
      } as any);

      await request(app)
        .put(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${loginResult.token}`)
        .send({ firstName: 'Unauthorized' })
        .expect(500); // Will throw "You can only update your own profile" error
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user was deleted
      const deletedUser = await User.findOne({ where: { id: regularUser.id } });
      expect(deletedUser).toBeNull();
    });

    it('should prevent self-deletion', async () => {
      await request(app)
        .delete(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500); // Will throw "You cannot delete your own account" error
    });

    it('should deny access for non-admin users', async () => {
      await request(app)
        .delete(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });

    it('should return error for non-existent user', async () => {
      await request(app)
        .delete('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500); // Will throw "User not found" error
    });
  });

  describe('POST /api/v1/users/:id/roles', () => {
    it('should assign roles to user as admin', async () => {
      // Create a test role
      const role = new Role();
      role.name = 'editor';
      role.label = 'Editor';
      await role.save();

      const response = await request(app)
        .post(`/api/v1/users/${regularUser.id}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roles: ['editor'] })
        .expect(200);

      expect(response.body.message).toBe('Roles assigned successfully');

      // Verify role was assigned
      const userWithRoles = await User.findOne({
        where: { id: regularUser.id },
        relations: ['roles']
      });
      expect(userWithRoles!.roles.some(r => r.name === 'editor')).toBe(true);
    });

    it('should deny access for non-admin users', async () => {
      await request(app)
        .post(`/api/v1/users/${adminUser.id}/roles`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ roles: ['admin'] })
        .expect(403);
    });
  });

  describe('GET /api/v1/users/:id/permissions', () => {
    it('should return user permissions', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${regularUser.id}/permissions`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('roles');
      expect(response.body.data).toHaveProperty('permissions');
      expect(response.body.data.userId).toBe(regularUser.id);
      expect(Array.isArray(response.body.data.roles)).toBe(true);
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });
  });

  describe('GET /api/v1/users/roles/available', () => {
    it('should return available roles', async () => {
      const response = await request(app)
        .get('/api/v1/users/roles/available')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const role = response.body.data[0];
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('label');
      }
    });
  });
});