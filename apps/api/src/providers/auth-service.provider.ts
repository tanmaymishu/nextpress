import ServiceProvider from './service-provider';
import PassportJWT from 'passport-jwt';
import PassportLocal from 'passport-local';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { Request } from 'express';
import { User } from '@/database/sql/entities/User';

export default class AuthServiceProvider extends ServiceProvider {
  async register() {
    const JwtStrategy = PassportJWT.Strategy;
    // ExtractJwt = PassportJWT.ExtractJwt;

    const customFields = {
      usernameField: 'email',
      passwordField: 'password'
    };
    const LocalStrategy = PassportLocal.Strategy;
    const localStrategy = new LocalStrategy(customFields, async (username, password, done) => {
      const user = await User.createQueryBuilder('user')
        .where('user.email = :email', { email: username })
        .addSelect('user.password')
        .getOne();

      if (user && bcrypt.compareSync(password, user.password)) {
        return done(null, user);
      }
      return done(null, false);
    });

    passport.use(localStrategy);

    const opts = {
      jwtFromRequest: function (req: Request) {
        let token = null;

        // First, check Authorization header (Bearer token)
        if (req && req.headers && req.headers.authorization) {
          const authHeader = req.headers.authorization;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
          }
        }

        // If no header token, fall back to cookie
        if (!token && req && req.cookies) {
          token = req.cookies['jwt'];
        }

        return token;
      },
      secretOrKey: process.env.JWT_SECRET!,
      issuer: 'api.example.com',
      audience: 'app.example.com'
    };
    const jwtStrategy = new JwtStrategy(opts, async function (payload: any, done: any) {
      // Check if token is expired (payload.exp is in seconds, Date.now() is in milliseconds)
      if (payload.exp && Date.now() > payload.exp * 1000) {
        return done(null, false);
      }

      // Verify user still exists in database
      const user = await User.findOneBy({ id: payload.sub });

      if (user) {
        // 🚀 PERFORMANCE: Return JWT payload with permissions instead of just user entity
        return done(null, {
          id: user.id,
          sub: payload.sub,
          permissions: payload.permissions || [],
          roles: payload.roles || [],
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
      }
      return done(null, false);
    });

    passport.use(jwtStrategy);

    passport.serializeUser(function (user: any, done) {
      done(null, user.id);
    });

    passport.deserializeUser(async function (id: any, done) {
      const user = await User.findOneBy({ id });
      if (user) {
        done(null, user);
      } else {
        done(new Error('User not found'));
      }
    });
  }
}
