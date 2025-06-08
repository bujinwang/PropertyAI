import express from 'express';
import { register, login } from '../controllers/authController';
import { validate } from '../middleware/validationMiddleware';
import { check } from 'express-validator';

const router = express.Router();

router.post(
  '/register',
  [
    check('email').isEmail(),
    check('password').isLength({ min: 8 }),
    check('firstName').not().isEmpty(),
    check('lastName').not().isEmpty(),
    check('role').isIn(['PROPERTY_MANAGER', 'TENANT', 'OWNER']),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    check('email').isEmail(),
    check('password').exists(),
  ],
  validate,
  login
);

export default router;
