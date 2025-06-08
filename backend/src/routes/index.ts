import express from 'express';
import propertyRoutes from './propertyRoutes';
import unitRoutes from './unitRoutes';
import imageRoutes from './imageRoutes';
import searchRoutes from './searchRoutes';
import geocodingRoutes from './geocodingRoutes';
import listingRoutes from './listingRoutes';
import applicationRoutes from './applicationRoutes';
import aiContentRoutes from './aiContentRoutes';
import authRoutes from './authRoutes';
import oauthRoutes from './oauthRoutes';
import mfaRoutes from './mfaRoutes';
import usersRoutes from './usersRoutes';

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
router.use(`${API_PREFIX}/listings`, listingRoutes); // Property listing management routes
router.use(`${API_PREFIX}/applications`, applicationRoutes); // Tenant application routes
router.use(`${API_PREFIX}/ai-content`, aiContentRoutes); // AI-generated content routes
router.use(`${API_PREFIX}/auth`, authRoutes); // Primary authentication routes
router.use(`${API_PREFIX}/auth`, oauthRoutes); // OAuth routes for Google authentication
router.use(`${API_PREFIX}/mfa`, mfaRoutes); // Multi-factor authentication routes
router.use(`${API_PREFIX}/users`, usersRoutes); // User management routes with inter-service endpoints

// 404 handler for API routes
router.use(`${API_PREFIX}/*`, (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

export default router; 