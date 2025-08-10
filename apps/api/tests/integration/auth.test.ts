import 'reflect-metadata';
import request from 'supertest';
import app from '../../src/app';
import { refreshDB } from '../bootstrap';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { User } from '../../src/database/sql/entities/User';
import bcrypt from 'bcryptjs';

describe('Authentication API', () => {
  beforeEach(async () => {
    await refreshDB(true); // Seed the database with permissions and admin
  });

  describe('POST /api/v1/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user).not.toHaveProperty('password'); // Ensure password is not returned

      // Verify user was created in database
      const createdUser = await User.findOne({ where: { email: userData.email } });
      expect(createdUser).toBeDefined();
      expect(createdUser!.firstName).toBe(userData.firstName);
    });

    it('should reject registration with missing fields', async () => {
      const incompleteData = {
        firstName: 'John',
        email: 'john@test.com'
        // missing lastName and password
      };

      const response = await request(app)
        .post('/api/v1/register')
        .send(incompleteData)
        .expect(422);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Last name is missing'
        })
      );
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Password is missing'
        })
      );
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/register')
        .send(userData)
        .expect(422);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Invalid value'
        })
      );
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/api/v1/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/register')
        .send({
          ...userData,
          firstName: 'Jane'
        })
        .expect(422);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Email has already been taken.'
        })
      );
    });
  });

  describe('POST /api/v1/login', () => {
    let testUser: User;

    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 1);
      testUser = new User();
      testUser.firstName = 'John';
      testUser.lastName = 'Doe';
      testUser.email = 'john@test.com';
      testUser.password = hashedPassword;
      await testUser.save();
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'john@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Check that JWT cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies) && cookies.some((cookie: string) => cookie.startsWith('jwt='))).toBe(true);
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/login')
        .send(loginData)
        .expect(422);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid username or password');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'john@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/login')
        .send(loginData)
        .expect(422);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Invalid username or password');
    });

    it('should reject login with missing fields', async () => {
      const loginData = {
        email: 'john@test.com'
        // missing password
      };

      const response = await request(app)
        .post('/api/v1/login')
        .send(loginData)
        .expect(422);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/v1/logout', () => {
    it('should logout successfully and clear JWT cookie', async () => {
      const response = await request(app)
        .post('/api/v1/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Logged out successfully');

      // Check that JWT cookie is cleared
      const cookies = response.headers['set-cookie'];
      if (cookies && Array.isArray(cookies)) {
        const jwtCookie = cookies.find((cookie: string) => cookie.startsWith('jwt='));
        if (jwtCookie) {
          expect(jwtCookie).toContain('jwt=;'); // Empty value indicates cleared cookie
        }
      }
    });
  });
});
