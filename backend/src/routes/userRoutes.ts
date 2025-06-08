import { Router } from 'express';
import UserController from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';
import { rbacMiddleware } from '../middleware/rbacMiddleware';

const router = Router();

router.get(
  '/',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  UserController.getAllUsers
);
router.post('/', UserController.createUser);
router.get('/:id', authMiddleware, UserController.getUserById);
router.put('/:id', authMiddleware, UserController.updateUser);
router.delete(
  '/:id',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  UserController.deleteUser
);

export default router;
