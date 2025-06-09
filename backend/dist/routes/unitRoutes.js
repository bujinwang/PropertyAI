"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const unitController_1 = require("../controllers/unitController");
const router = express_1.default.Router();
/**
 * @route   GET /api/units
 * @desc    Get all units with filtering and pagination
 * @access  Private (Property Manager, Admin)
 */
router.get('/', (req, res) => unitController_1.unitController.getUnits(req, res));
/**
 * @route   POST /api/units
 * @desc    Create a new unit
 * @access  Private (Property Manager, Admin)
 */
router.post('/', (req, res) => unitController_1.unitController.createUnit(req, res));
/**
 * @route   GET /api/units/property/:propertyId
 * @desc    Get all units for a specific property
 * @access  Private (Property Manager, Admin, Owner)
 */
router.get('/property/:propertyId', (req, res) => unitController_1.unitController.getUnitsByProperty(req, res));
/**
 * @route   GET /api/units/property/:propertyId/occupancy
 * @desc    Get occupancy statistics for a property
 * @access  Private (Property Manager, Admin, Owner)
 */
router.get('/property/:propertyId/occupancy', (req, res) => unitController_1.unitController.getPropertyOccupancy(req, res));
/**
 * @route   GET /api/units/:id
 * @desc    Get a unit by ID
 * @access  Private (Property Manager, Admin, Tenant if associated)
 */
router.get('/:id', (req, res) => unitController_1.unitController.getUnitById(req, res));
/**
 * @route   PUT /api/units/:id
 * @desc    Update a unit
 * @access  Private (Property Manager, Admin)
 */
router.put('/:id', (req, res) => unitController_1.unitController.updateUnit(req, res));
/**
 * @route   PUT /api/units/:id/availability
 * @desc    Set unit availability
 * @access  Private (Property Manager, Admin)
 */
router.put('/:id/availability', (req, res) => unitController_1.unitController.setUnitAvailability(req, res));
/**
 * @route   PUT /api/units/:id/tenant
 * @desc    Assign a tenant to a unit
 * @access  Private (Property Manager, Admin)
 */
router.put('/:id/tenant', (req, res) => unitController_1.unitController.assignTenant(req, res));
/**
 * @route   DELETE /api/units/:id/tenant
 * @desc    Remove tenant from a unit
 * @access  Private (Property Manager, Admin)
 */
router.delete('/:id/tenant', (req, res) => unitController_1.unitController.removeTenant(req, res));
/**
 * @route   DELETE /api/units/:id
 * @desc    Delete a unit
 * @access  Private (Admin only)
 */
router.delete('/:id', (req, res) => unitController_1.unitController.deleteUnit(req, res));
exports.default = router;
//# sourceMappingURL=unitRoutes.js.map