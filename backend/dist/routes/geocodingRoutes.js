"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geocodingController = __importStar(require("../controllers/geocodingController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * @route POST /api/geocoding/validate
 * @desc Validate an address and return normalized address information
 * @access Private
 */
router.post('/validate', authMiddleware_1.authMiddleware.protect, geocodingController.validateAddress);
/**
 * @route POST /api/geocoding/geocode
 * @desc Geocode an address to retrieve coordinate information
 * @access Private
 */
router.post('/geocode', authMiddleware_1.authMiddleware.protect, geocodingController.geocodeAddress);
/**
 * @route POST /api/geocoding/reverse
 * @desc Reverse geocode coordinates to get address information
 * @access Private
 */
router.post('/reverse', authMiddleware_1.authMiddleware.protect, geocodingController.reverseGeocode);
/**
 * @route POST /api/geocoding/property/:id
 * @desc Update a property with geocoded location data
 * @access Private
 */
router.post('/property/:id', authMiddleware_1.authMiddleware.protect, geocodingController.updatePropertyLocation);
/**
 * @route GET /api/geocoding/nearby
 * @desc Get nearby points of interest
 * @access Private
 */
router.get('/nearby', authMiddleware_1.authMiddleware.protect, geocodingController.getNearbyPlaces);
/**
 * @route POST /api/geocoding/batch
 * @desc Batch validate and geocode multiple properties
 * @access Private
 */
router.post('/batch', authMiddleware_1.authMiddleware.protect, geocodingController.batchGeocodeProperties);
exports.default = router;
//# sourceMappingURL=geocodingRoutes.js.map