import express from 'express';
import { propertyController } from '../controllers/propertyController';

const router = express.Router();

/**
 * @route   GET /api/properties
 * @desc    Get all properties with filtering and pagination
 * @access  Private (Property Manager, Admin)
 */
router.get('/', propertyController.getProperties.bind(propertyController));

/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private (Property Manager, Admin)
 */
router.post('/', propertyController.createProperty.bind(propertyController));

/**
 * @route   GET /api/properties/stats
 * @desc    Get property statistics
 * @access  Private (Property Manager, Admin)
 */
router.get('/stats', propertyController.getPropertyStats.bind(propertyController));

/**
 * @route   GET /api/properties/:id
 * @desc    Get a property by ID
 * @access  Private (Property Manager, Admin, Tenant if associated)
 */
router.get('/:id', propertyController.getPropertyById.bind(propertyController));

/**
 * @route   PUT /api/properties/:id
 * @desc    Update a property
 * @access  Private (Property Manager, Admin)
 */
router.put('/:id', propertyController.updateProperty.bind(propertyController));

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property (soft or hard delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', propertyController.deleteProperty.bind(propertyController));

export default router; 