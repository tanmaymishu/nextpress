import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { requirePermission } from './permission.middleware';

const HOME = '/dashboard';

const auth = {
  guest: (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return next();
    }
    return res.redirect(HOME);
  },
  web: (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.redirect('/login');
  },
  api: passport.authenticate('jwt', { session: false }),
  
  // Combined auth and permission middleware
  apiWithPermission: (permission: string) => {
    return [
      passport.authenticate('jwt', { session: false }),
      requirePermission(permission)
    ];
  }
};

export default auth;
