import express from 'express';
import { prisma } from '../config/database';
import { handleDatabaseError } from '../utils/dbUtils';
import { authMiddleware } from '../middleware/authMiddleware';
import { ServiceCommunicationError } from '../utils/serviceUtils';
import UserController from '../controllers/userController';

const router = express.Router();

// Generic User CRUD routes
router.post('/', authMiddleware.protect, authMiddleware.admin, UserController.createUser);
router.get('/', authMiddleware.protect, authMiddleware.admin, UserController.getAllUsers);
router.get('/:id', authMiddleware.protect, authMiddleware.admin, UserController.getUserById);
router.put('/:id', authMiddleware.protect, authMiddleware.admin, UserController.updateUser);
router.delete('/:id', authMiddleware.protect, authMiddleware.admin, UserController.deleteUser);


/**
 * @route   GET /api/users/validate/:id
 * @desc    Validate if a user exists and is active (for inter-service communication)
 * @access  Internal
 */
router.get('/validate/:id', async (req, res, next) => {
  try {
    // Check if this is an internal service call
    const isInternalCall = req.headers['x-internal-service-call'] === 'true';
    
    if (!isInternalCall) {
      throw new ServiceCommunicationError('Unauthorized access to internal endpoint', 403);
    }
    
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
 * @desc    Get basic user information (for inter-service communication)
 * @access  Internal
 */
router.get('/basic/:id', async (req, res, next) => {
  try {
    // Check if this is an internal service call
    const isInternalCall = req.headers['x-internal-service-call'] === 'true';
    
    if (!isInternalCall) {
      throw new ServiceCommunicationError('Unauthorized access to internal endpoint', 403);
    }
    
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
