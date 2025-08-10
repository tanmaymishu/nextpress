import { User } from '@/database/sql/entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mailQueue } from '@/queues/mail';
import SendWelcomeEmail from '@/jobs/send-welcome-email';
import { Request } from 'express';
import { Service } from 'typedi';
import { AppDataSource } from '@/database/sql/data-source';
@Service()
export default class AuthService {
  async createUser(body: any) {
    // Check if this is the first user
    const isFirstUser = await User.isFirstUserCreation();

    // Create new user
    let user = new User();
    user.firstName = body.firstName;
    user.lastName = body.lastName;
    user.email = body.email;
    user.password = bcrypt.hashSync(body.password, 10);

    // Save user first to get an ID
    await user.save();

    // Assign permissions based on whether this is the first user
    if (isFirstUser) {
      // First user gets all permissions (admin)
      await user.assignAllPermissions();
    } else {
      // Subsequent users get default permissions (all except user edit/delete)
      await user.assignDefaultUserPermissions();
    }

    // Reload user with permissions for JWT generation
    const userWithPermissions = await User.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions', 'permissions']
    });

    return {
      id: userWithPermissions!.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: userWithPermissions!.isAdmin,
      token: this.generateJwt(userWithPermissions!)
    };
  }

  async register(req: Request) {
    const user = await this.createUser(req.body);

    // TODO: Uncomment when email service is properly configured
    // mailQueue.add(SendWelcomeEmail.jobName, user);

    return user;
  }

  async login(req: Request) {
    const user = await User.createQueryBuilder('user')
      .where('user.email = :email', { email: req.body.email })
      .addSelect('user.password')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'rolePermissions')
      .leftJoinAndSelect('user.permissions', 'directPermissions')
      .getOne();

    if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
      // SECURITY: Generic error message to prevent user enumeration
      throw new Error('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      token: this.generateJwt(user)
    };
  }

  generateJwt(user: User) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT secret not set');
    }

    // Collect all permissions from roles and direct permissions
    const permissions = new Set<string>();

    // Add direct permissions
    if (user.permissions) {
      user.permissions.forEach(permission => permissions.add(permission.name));
    }

    // Add role-based permissions
    if (user.roles) {
      user.roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(permission => permissions.add(permission.name));
        }
      });
    }

    return jwt.sign(
      {
        sub: user.id,
        permissions: Array.from(permissions), // 🚀 Store permissions in JWT
        roles: user.roles?.map(role => role.name) || [],
        iat: Math.floor(Date.now() / 1000),
        iss: 'api.example.com',
        aud: 'app.example.com'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: 604800
      }
    );
  }
}
