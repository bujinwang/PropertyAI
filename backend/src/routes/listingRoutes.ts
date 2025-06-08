import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import * as listingController from '../controllers/listingController';

const router = Router();

// @route   POST api/listings
// @desc    Create a new listing
// @access  Private (Property Manager or Admin)
router.post('/', [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])], listingController.createListing);

// @route   GET api/listings
// @desc    Get all listings
// @access  Public
router.get('/', listingController.getListings);

// @route   GET api/listings/:id
// @desc    Get a specific listing by ID
// @access  Public
router.get('/:id', listingController.getListing);

// @route   PUT api/listings/:id
// @desc    Update a listing
// @access  Private (Property Manager or Admin)
router.put('/:id', [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])], listingController.updateListing);

// @route   DELETE api/listings/:id
// @desc    Delete a listing
// @access  Private (Property Manager or Admin)
router.delete('/:id', [authMiddleware.verifyToken, authMiddleware.checkRole(['PROPERTY_MANAGER', 'ADMIN'])], listingController.deleteListing);

export default router;
