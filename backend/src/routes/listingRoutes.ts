import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import listingController from '../controllers/listingController';

const router = Router();

// @route   POST api/listings
// @desc    Create a new listing
// @access  Private (Property Manager or Admin)
router.post('/', [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])], listingController.createListing);

// @route   GET api/listings
// @desc    Get all listings
// @access  Public
router.get('/', listingController.getAllListings);

// @route   GET api/listings/:id
// @desc    Get a specific listing by ID
// @access  Public
router.get('/:id', listingController.getListingById);

// @route   PUT api/listings/:id
// @desc    Update a listing
// @access  Private (Property Manager or Admin)
router.put('/:id', [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])], listingController.updateListing);

// @route   DELETE api/listings/:id
// @desc    Delete a listing
// @access  Private (Property Manager or Admin)
router.delete('/:id', [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])], listingController.deleteListing);

// @route   POST api/listings/:listingId/generate-description
// @desc    Generate a new description for a listing using AI
// @access  Private (Property Manager or Admin)
router.post('/:listingId/generate-description', [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])], listingController.generateDescription);

// @route   POST api/listings/:listingId/generate-price-recommendation
// @desc    Generate a price recommendation for a listing using AI
// @access  Private (Property Manager or Admin)
router.post('/:listingId/generate-price-recommendation', [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])], listingController.generatePriceRecommendation);

export default router;