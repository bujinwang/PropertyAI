import express from 'express';
import { prisma } from '../config/database';
import { handleDatabaseError } from '../utils/dbUtils';
import { authMiddleware } from '../middleware/authMiddleware';
import UserController from '../controllers/userController';

const router = express.Router();

// Generic User CRUD routes
router.post('/', authMiddleware.protect, authMiddleware.admin, UserController.createUser);
router.get('/', authMiddleware.protect, authMiddleware.admin, UserController.getAllUsers);
router.get('/:id', authMiddleware.protect, authMiddleware.admin, UserController.getUserById);
router.put('/:id', authMiddleware.protect, authMiddleware.admin, UserController.updateUser);
router.delete('/:id', authMiddleware.protect, authMiddleware.admin, UserController.deleteUser);


/**
 * Internal-service routes.
 *
 * The `x-internal-service-call: true` header check these handlers used is NOT a
 * security control — any client can set an arbitrary header. `/users/*` is
 * behind the global `requireAuth`, so the caller at least had to hold a valid
 * JWT; but a TENANT could still read any user's email and role, one id at a
 * time (verified: a TENANT token + the header returned an OWNER's record).
 *
 * These are now ADMIN-only. If genuine machine-to-machine callers need them,
 * they must present a shared secret compared against an env var — not a header
 * the caller simply asserts about itself.
 */
router.get('/validate/:id', authMiddleware.protect, authMiddleware.admin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/basic/:id
 * @desc    Get basic user information
 * @access  Private (ADMIN)
 */
router.get('/basic/:id', authMiddleware.protect, authMiddleware.admin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Export the router
export default router;
