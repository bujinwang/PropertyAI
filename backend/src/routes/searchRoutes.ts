import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /api/search/properties
 * @desc    Search for properties with advanced filtering
 * @access  Public
 */
router.get('/properties', searchController.searchProperties.bind(searchController));

/**
 * @route   GET /api/search/units
 * @desc    Search for available units with advanced filtering
 * @access  Public
 */
router.get('/units', searchController.searchAvailableUnits.bind(searchController));

/**
 * @route   GET /api/search/property-types
 * @desc    Get all property types (enum values)
 * @access  Public
 */
router.get('/property-types', searchController.getPropertyTypes.bind(searchController));

export default router; 