"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchController_1 = require("../controllers/searchController");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/search/properties
 * @desc    Search for properties with advanced filtering
 * @access  Public
 */
router.get('/properties', searchController_1.searchController.searchProperties.bind(searchController_1.searchController));
/**
 * @route   GET /api/search/units
 * @desc    Search for available units with advanced filtering
 * @access  Public
 */
router.get('/units', searchController_1.searchController.searchAvailableUnits.bind(searchController_1.searchController));
/**
 * @route   GET /api/search/property-types
 * @desc    Get all property types (enum values)
 * @access  Public
 */
router.get('/property-types', searchController_1.searchController.getPropertyTypes.bind(searchController_1.searchController));
exports.default = router;
//# sourceMappingURL=searchRoutes.js.map