import express from 'express';
import propertyRoutes from './propertyRoutes';
import unitRoutes from './unitRoutes';
import imageRoutes from './imageRoutes';
import searchRoutes from './searchRoutes';
import geocodingRoutes from './geocodingRoutes';

const router = express.Router();

// API version prefix
const API_PREFIX = '/api';

// Health check endpoint
router.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Register routes
router.use(`${API_PREFIX}/properties`, propertyRoutes);
router.use(`${API_PREFIX}/units`, unitRoutes);
router.use(`${API_PREFIX}`, imageRoutes); // Image routes handle both property and unit images
router.use(`${API_PREFIX}/search`, searchRoutes); // Search routes for advanced filtering
router.use(`${API_PREFIX}/geocoding`, geocodingRoutes); // Geocoding and address validation routes

// 404 handler for API routes
router.use(`${API_PREFIX}/*`, (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

export default router; 