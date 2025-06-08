import express from 'express';
import { prisma } from '../config/database';
import { handleDatabaseError } from '../utils/dbUtils';
import { authMiddleware } from '../middleware/authMiddleware';
import { ServiceCommunicationError } from '../utils/serviceUtils';

const router = express.Router();

/**
 * @route   GET /api/properties/validate/:id
 * @desc    Validate if a property exists and is active (for inter-service communication)
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
    
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/properties/basic/:id
 * @desc    Get basic property information (for inter-service communication)
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
    
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true
      }
    });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/properties/stats
 * @desc    Get property statistics
 * @access  Private (Property Manager, Admin)
 */
router.get('/stats', authMiddleware.verifyToken, async (req, res, next) => {
  try {
    // Get count by property type
    const propertyTypeStats = await prisma.$queryRaw`
      SELECT "propertyType", COUNT(*) as count
      FROM "Property"
      GROUP BY "propertyType"
    `;
    
    // Get count of active vs inactive properties
    const [activeCount, inactiveCount] = await Promise.all([
      prisma.property.count({ where: { isActive: true } }),
      prisma.property.count({ where: { isActive: false } })
    ]);
    
    // Get total units
    const totalUnitsResult = await prisma.$queryRaw`
      SELECT SUM("totalUnits") as total
      FROM "Property"
    `;
    
    const totalUnits = totalUnitsResult[0]?.total || 0;
    
    res.json({
      byPropertyType: propertyTypeStats,
      activeStatus: {
        active: activeCount,
        inactive: inactiveCount
      },
      totalUnits
    });
  } catch (error) {
    next(handleDatabaseError(error));
  }
});

/**
 * @route   GET /api/properties
 * @desc    Get all properties with pagination and filtering
 * @access  Private
 */
router.get('/', authMiddleware.verifyToken, async (req, res, next) => {
  try {
    const { page = '1', limit = '10', search, city, state, propertyType } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Build where clause for filtering
    const where: any = {
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { address: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
      }),
      ...(city && { city: { contains: city as string, mode: 'insensitive' } }),
      ...(state && { state: { contains: state as string, mode: 'insensitive' } }),
      ...(propertyType && { propertyType: propertyType as string })
    };
    
    // Get properties and total count
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          propertyType: true,
          totalUnits: true,
          isActive: true,
          createdAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.property.count({ where })
    ]);
    
    res.json({
      properties,
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

/**
 * @route   GET /api/properties/:id
 * @desc    Get a property by ID
 * @access  Private
 */
router.get('/:id', authMiddleware.verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        units: true
      }
    });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    next(handleDatabaseError(error));
  }
});

export default router; 