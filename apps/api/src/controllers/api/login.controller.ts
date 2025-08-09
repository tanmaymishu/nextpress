import { Request, Response } from 'express';
import { body } from 'express-validator';
import { Controller, Post, Req, Res, UseBefore } from 'routing-controllers';
import { Service } from 'typedi';
import validate from '@/middleware/validation.middleware';
import AuthService from '@/services/auth.service';

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
        res.cookie('jwt', user.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Should be true on production
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Required for cross-origin cookies
        });
        return res.json({ user });
      })
      .catch((err) => {
        console.log(err);
        return res.status(422).json({ message: 'Invalid username or password' });
      });
  }

  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    // Clear the JWT cookie
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    // Destroy session if it exists
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.log('Session destruction error:', err);
        }
      });
    }
    
    return res.json({ message: 'Logged out successfully' });
  }
}
