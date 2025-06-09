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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddress = validateAddress;
exports.geocodeAddress = geocodeAddress;
exports.reverseGeocode = reverseGeocode;
exports.updatePropertyLocation = updatePropertyLocation;
exports.getNearbyPlaces = getNearbyPlaces;
exports.batchGeocodeProperties = batchGeocodeProperties;
const geocodingService = __importStar(require("../services/geocodingService"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Validates an address and returns normalized address information
 * @route POST /api/geocoding/validate
 */
async function validateAddress(req, res) {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, message: 'Address is required' });
        }
        const validationResult = await geocodingService.validateAddress(address);
        return res.status(validationResult.isValid ? 200 : 400).json(validationResult);
    }
    catch (error) {
        console.error('Error in validateAddress controller:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error during address validation',
        });
    }
}
/**
 * Geocodes an address to retrieve coordinate information
 * @route POST /api/geocoding/geocode
 */
async function geocodeAddress(req, res) {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, message: 'Address is required' });
        }
        const geocodeResult = await geocodingService.geocodeAddress(address);
        if (!geocodeResult.success) {
            return res.status(400).json(geocodeResult);
        }
        return res.status(200).json(geocodeResult);
    }
    catch (error) {
        console.error('Error in geocodeAddress controller:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error during geocoding',
        });
    }
}
/**
 * Reverse geocodes coordinates to get address information
 * @route POST /api/geocoding/reverse
 */
async function reverseGeocode(req, res) {
    try {
        const { latitude, longitude } = req.body;
        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
        }
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude must be valid numbers',
            });
        }
        const reverseGeocodeResult = await geocodingService.reverseGeocode(lat, lng);
        if (!reverseGeocodeResult.success) {
            return res.status(400).json(reverseGeocodeResult);
        }
        return res.status(200).json(reverseGeocodeResult);
    }
    catch (error) {
        console.error('Error in reverseGeocode controller:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error during reverse geocoding',
        });
    }
}
/**
 * Updates a property with geocoded location data
 * @route POST /api/geocoding/property/:id
 */
async function updatePropertyLocation(req, res) {
    try {
        const { id } = req.params;
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, message: 'Address is required' });
        }
        // Check if property exists
        const property = await prisma.property.findUnique({
            where: { id },
        });
        if (!property) {
            return res.status(404).json({
                success: false,
                message: `Property with ID ${id} not found`,
            });
        }
        // Geocode the address
        const geocodeResult = await geocodingService.geocodeAddress(address);
        if (!geocodeResult.success) {
            return res.status(400).json({
                success: false,
                message: geocodeResult.message || 'Failed to geocode the provided address',
            });
        }
        // Update property with geocoded information
        const updatedProperty = await geocodingService.updatePropertyGeolocation(id, geocodeResult);
        return res.status(200).json({
            success: true,
            property: updatedProperty,
        });
    }
    catch (error) {
        console.error('Error in updatePropertyLocation controller:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error updating property location',
        });
    }
}
/**
 * Gets nearby points of interest
 * @route GET /api/geocoding/nearby
 */
async function getNearbyPlaces(req, res) {
    try {
        const { latitude, longitude, radius, type } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
        }
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const rad = radius ? parseInt(radius) : 1000;
        const placeType = type || 'restaurant';
        if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parameters provided',
            });
        }
        const placesResult = await geocodingService.getNearbyPlaces(lat, lng, rad, placeType);
        return res.status(200).json(placesResult);
    }
    catch (error) {
        console.error('Error in getNearbyPlaces controller:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error getting nearby places',
        });
    }
}
/**
 * Batch validates and geocodes multiple properties
 * @route POST /api/geocoding/batch
 */
async function batchGeocodeProperties(req, res) {
    try {
        const { propertyIds } = req.body;
        if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Array of property IDs is required',
            });
        }
        const results = [];
        const errors = [];
        // Process each property
        for (const propertyId of propertyIds) {
            try {
                // Get the property
                const property = await prisma.property.findUnique({
                    where: { id: propertyId },
                });
                if (!property) {
                    errors.push({
                        propertyId,
                        error: `Property with ID ${propertyId} not found`,
                    });
                    continue;
                }
                // Create address string
                const addressString = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}, ${property.country}`;
                // Geocode the address
                const geocodeResult = await geocodingService.geocodeAddress(addressString);
                if (!geocodeResult.success) {
                    errors.push({
                        propertyId,
                        error: geocodeResult.message || 'Failed to geocode property address',
                    });
                    continue;
                }
                // Update property with geocoded information
                const updatedProperty = await geocodingService.updatePropertyGeolocation(propertyId, geocodeResult);
                results.push({
                    propertyId,
                    success: true,
                    property: updatedProperty,
                });
            }
            catch (error) {
                errors.push({
                    propertyId,
                    error: error instanceof Error ? error.message : 'Unknown error processing property',
                });
            }
        }
        return res.status(200).json({
            success: true,
            processed: results.length,
            failed: errors.length,
            results,
            errors,
        });
    }
    catch (error) {
        console.error('Error in batchGeocodeProperties controller:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error during batch geocoding',
        });
    }
}
//# sourceMappingURL=geocodingController.js.map