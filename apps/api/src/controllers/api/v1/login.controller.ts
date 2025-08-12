import { Request, Response } from 'express';
import { body } from 'express-validator';
import { Controller, Post, Req, Res, UseBefore } from 'routing-controllers';
import { Service } from 'typedi';
import validate from '@/middleware/validation.middleware';
import AuthService from '@/services/auth.service';
import logger from '@/util/logger';

@Controller('/api/v1')
@Service()
export class LoginController {
  constructor(public authService: AuthService) {}

  static rules = [body('email').exists(), body('password').exists()];

  @Post('/login')
  @UseBefore(validate(LoginController.rules))
  async store(@Req() req: Request, @Res() res: Response) {
    return this.authService
      .login(req)
      .then((user) => {
        // Determine if we're actually on HTTPS (not just NODE_ENV=production)
        const isSecureContext = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
        
        // Set cookie with proper settings based on actual protocol
        res.cookie('jwt', user.token, {
          httpOnly: true,
          secure: isSecureContext,
          sameSite: isSecureContext ? 'none' : 'lax',
        });

        // Also return token in response for cross-domain localStorage usage
        return res.status(200).json({
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin
          },
          token: user.token // Include token for localStorage storage
        });
      })
      .catch((err) => {
        logger.debug('Login attempt failed:', err.message);
        return res.status(422).json({ message: 'Invalid username or password' });
      });
  }

  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    // Clear the JWT cookie with matching settings
    const isSecureContext = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
    
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: isSecureContext,
      sameSite: isSecureContext ? 'none' : 'lax',
    });

    // Destroy session if it exists
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destruction error:', err);
        }
      });
    }

    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
