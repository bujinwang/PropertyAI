import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Redirect to provider for authentication
router.get('/:provider', (req, res, next) => {
  const provider = req.params.provider;
  passport.authenticate(provider, { scope: ['email', 'profile'] })(req, res, next);
});

// Callback URL for provider
router.get('/:provider/callback', (req, res, next) => {
  const provider = req.params.provider;
  passport.authenticate(provider, {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
  })(req, res, next);
});

export default router;
