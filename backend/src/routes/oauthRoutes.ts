import express, { Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Extend Express request to include user
interface UserRequest extends Request {
  user?: any; // Allow any user type since it can come from various strategies
}

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }), 
  (req: UserRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.redirect('/login?error=user_not_found');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET!, 
        { expiresIn: '1d' }
      );
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:19006'}/oauth-callback?token=${token}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login?error=server_error');
    }
  }
);

export default router; 