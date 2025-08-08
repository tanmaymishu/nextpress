import { Request, Response } from 'express';
import { Controller, Get, Req, Res, UseBefore } from 'routing-controllers';
import { Service } from 'typedi';
import { User } from '@/database/sql/entities/User';
import auth from '@/middleware/auth.middleware';

@Service()
@Controller('/api/v1')
export class UserController {
  @Get('/users')
  async index(@Req() req: Request, @Res() res: Response) {
    const users = await User.find();
    return res.json(users);
  }

  @Get('/me')
  @UseBefore(auth.api)
  async me(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = req.user as any;
    
    return res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  }
}
