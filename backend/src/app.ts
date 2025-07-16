import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import propertyRoutes from './routes/propertyRoutes';
import pricingRoutes from './routes/pricingRoutes';
import listingRoutes from './routes/listingRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import aiContentRoutes from './routes/aiContentRoutes';
import modelTrainingRoutes from './routes/modelTraining.routes';
import dataPreprocessingRoutes from './routes/dataPreprocessing.routes';
import modelRegistryRoutes from './routes/modelRegistry.routes';
import photoEnhancementRoutes from './routes/photoEnhancement.routes';
import monitoringRoutes from './routes/monitoring.routes';
import { responseTimeTracker } from './services/apiPerformance.service';
import { httpRequestCounter, httpRequestDurationMicroseconds } from './services/monitoring.service';

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
// Configure CORS to allow requests from mobile app and dashboard
app.use(cors({
  origin: [
    'http://localhost:3000', // Dashboard
    'http://localhost:5000', // PropertyApp frontend
    'http://localhost:8081', // Expo web app
    'exp://localhost:19000', // Expo development
    'http://localhost:19006' // Expo web alternative port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Monitoring middleware
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
    end({ route: req.route ? req.route.path : req.path, code: res.statusCode });
  });
  next();
});

app.use(responseTimeTracker); // Track response time

// Caching middleware
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-control', `public, max-age=300`); // 5 minutes
  }
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/ai-content', aiContentRoutes);
app.use('/api/model-training', modelTrainingRoutes);
app.use('/api/data-preprocessing', dataPreprocessingRoutes);
app.use('/api/model-registry', modelRegistryRoutes);
app.use('/api/photo-enhancement', photoEnhancementRoutes);
app.use('/metrics', monitoringRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  // Handle Prisma unique constraint violations
  if (err.code === 'P2002') {
    return res.status(409).json({
      status: 'error',
      message: 'User with this email already exists'
    });
  }
  
  // Handle AppError instances
  if (err.name === 'AppError') {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});



export default app;
