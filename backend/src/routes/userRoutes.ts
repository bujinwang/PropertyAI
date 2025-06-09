import { Router } from 'express';
import UserController from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { rbacMiddleware } from '../middleware/rbacMiddleware';

const router = Router();

router.get(
  '/',
  authMiddleware.protect,
  rbacMiddleware(['ADMIN']),
  UserController.getAllUsers
);
router.post('/', UserController.createUser);
router.get('/:id', authMiddleware.protect, UserController.getUserById);
router.put('/:id', authMiddleware.protect, UserController.updateUser);
router.delete(
  '/:id',
  authMiddleware.protect,
  rbacMiddleware(['ADMIN']),
  UserController.deleteUser
);

export default router;
