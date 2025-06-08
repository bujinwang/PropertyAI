import express from 'express';
import { Listing } from '../models/mongoModels';

const router = express.Router();

/**
 * @route   GET /api/listings
 * @desc    Get all listings with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { status, propertyId, minPrice, maxPrice } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (propertyId) {
      filter.propertyId = propertyId;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    const listings = await Listing.find(filter).sort({ dateCreated: -1 });
    
    res.json({
      status: 'success',
      count: listings.length,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching listings'
    });
  }
});

/**
 * @route   GET /api/listings/:id
 * @desc    Get a single listing by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }
    
    // Increment view count
    listing.views += 1;
    await listing.save();
    
    res.json({
      status: 'success',
      data: listing
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error fetching listing'
    });
  }
});

/**
 * @route   POST /api/listings
 * @desc    Create a new listing
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      propertyId,
      unitId,
      title,
      description,
      price,
      features,
      amenities,
      dateAvailable,
      contactInfo
    } = req.body;
    
    // Validate required fields
    if (!propertyId || !title || !description || !price || !dateAvailable || !contactInfo) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }
    
    const newListing = new Listing({
      propertyId,
      unitId,
      title,
      description,
      price,
      priceHistory: [{ date: new Date(), price }],
      features: features || [],
      amenities: amenities || [],
      dateAvailable: new Date(dateAvailable),
      contactInfo,
      status: 'draft'
    });
    
    const savedListing = await newListing.save();
    
    res.status(201).json({
      status: 'success',
      data: savedListing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating listing'
    });
  }
});

/**
 * @route   PUT /api/listings/:id
 * @desc    Update a listing
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }
    
    // Check if price is updated
    if (req.body.price && req.body.price !== listing.price) {
      // Add to price history
      listing.priceHistory.push({
        date: new Date(),
        price: req.body.price,
        reason: req.body.priceChangeReason || 'Manual update'
      });
    }
    
    // Update timestamp
    req.body.dateUpdated = new Date();
    
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      status: 'success',
      data: updatedListing
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating listing'
    });
  }
});

/**
 * @route   DELETE /api/listings/:id
 * @desc    Delete a listing
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }
    
    await listing.deleteOne();
    
    res.json({
      status: 'success',
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting listing'
    });
  }
});

/**
 * @route   POST /api/listings/:id/publish
 * @desc    Publish a listing (change status from draft to active)
 * @access  Private
 */
router.post('/:id/publish', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }
    
    if (listing.status === 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Listing is already published'
      });
    }
    
    listing.status = 'active';
    listing.dateUpdated = new Date();
    
    await listing.save();
    
    res.json({
      status: 'success',
      message: 'Listing published successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error publishing listing:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error publishing listing'
    });
  }
});

export default router; 