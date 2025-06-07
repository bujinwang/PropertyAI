import express from 'express';
import * as geocodingController from '../controllers/geocodingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @route POST /api/geocoding/validate
 * @desc Validate an address and return normalized address information
 * @access Private
 */
router.post('/validate', authMiddleware.verifyToken, geocodingController.validateAddress);

/**
 * @route POST /api/geocoding/geocode
 * @desc Geocode an address to retrieve coordinate information
 * @access Private
 */
router.post('/geocode', authMiddleware.verifyToken, geocodingController.geocodeAddress);

/**
 * @route POST /api/geocoding/reverse
 * @desc Reverse geocode coordinates to get address information
 * @access Private
 */
router.post('/reverse', authMiddleware.verifyToken, geocodingController.reverseGeocode);

/**
 * @route POST /api/geocoding/property/:id
 * @desc Update a property with geocoded location data
 * @access Private
 */
router.post('/property/:id', authMiddleware.verifyToken, geocodingController.updatePropertyLocation);

/**
 * @route GET /api/geocoding/nearby
 * @desc Get nearby points of interest
 * @access Private
 */
router.get('/nearby', authMiddleware.verifyToken, geocodingController.getNearbyPlaces);

/**
 * @route POST /api/geocoding/batch
 * @desc Batch validate and geocode multiple properties
 * @access Private
 */
router.post('/batch', authMiddleware.verifyToken, geocodingController.batchGeocodeProperties);

export default router; 