import { Request, Response } from 'express';
import * as geocodingService from '../services/geocodingService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Validates an address and returns normalized address information
 * @route POST /api/geocoding/validate
 */
export async function validateAddress(req: Request, res: Response) {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ success: false, message: 'Address is required' });
    }

    const validationResult = await geocodingService.validateAddress(address);
    return res.status(validationResult.isValid ? 200 : 400).json(validationResult);
  } catch (error) {
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
export async function geocodeAddress(req: Request, res: Response) {
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
  } catch (error) {
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
export async function reverseGeocode(req: Request, res: Response) {
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
  } catch (error) {
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
export async function updatePropertyLocation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ success: false, message: 'Address is required' });
    }

    // Check if rental (property) exists
    const rental = await prisma.rental.findUnique({
      where: { id },
    });

    if (!rental) {
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

    // Update rental with geocoded information
    const updatedProperty = await geocodingService.updatePropertyGeolocation(id, geocodeResult);

    return res.status(200).json({
      success: true,
      property: updatedProperty,
    });
  } catch (error) {
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
export async function getNearbyPlaces(req: Request, res: Response) {
  try {
    const { latitude, longitude, radius, type } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const rad = radius ? parseInt(radius as string) : 1000;
    const placeType = type as string || 'restaurant';

    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters provided',
      });
    }

    const placesResult = await geocodingService.getNearbyPlaces(lat, lng, rad, placeType);
    return res.status(200).json(placesResult);
  } catch (error) {
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
export async function batchGeocodeProperties(req: Request, res: Response) {
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
        // Get the rental (property)
        const rental = await prisma.rental.findUnique({
          where: { id: propertyId },
        });

        if (!rental) {
          errors.push({
            propertyId,
            error: `Property with ID ${propertyId} not found`,
          });
          continue;
        }

        // Create address string
        const addressString = `${rental.address}, ${rental.city}, ${rental.state} ${rental.zipCode}, ${rental.country}`;

        // Geocode the address
        const geocodeResult = await geocodingService.geocodeAddress(addressString);

        if (!geocodeResult.success) {
          errors.push({
            propertyId,
            error: geocodeResult.message || 'Failed to geocode property address',
          });
          continue;
        }

        // Update rental with geocoded information
        const updatedProperty = await geocodingService.updatePropertyGeolocation(propertyId, geocodeResult);
        
        results.push({
          propertyId,
          success: true,
          property: updatedProperty,
        });
      } catch (error) {
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
  } catch (error) {
    console.error('Error in batchGeocodeProperties controller:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error during batch geocoding',
    });
  }
}