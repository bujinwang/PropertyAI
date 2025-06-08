import express from 'express';
import { prisma } from '../config/database';
import { handleDatabaseError } from '../utils/dbUtils';
import { authMiddleware } from '../middleware/authMiddleware';
import { ServiceCommunicationError } from '../utils/serviceUtils';

const router = express.Router();

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

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin)
 */
router.get('/', authMiddleware.verifyToken, authMiddleware.checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const { page = '1', limit = '10', search, role } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause for filtering
    const where: any = {
      ...(search && {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role: role as string })
    };
    
    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          isActive: true,
          mfaEnabled: true,
          phone: true
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(handleDatabaseError(error));
  }
});

// Export the router
export default router; 