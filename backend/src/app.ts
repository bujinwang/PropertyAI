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
import listingRoutes from './routes/listingRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import aiContentRoutes from './routes/aiContentRoutes';
import modelTrainingRoutes from './routes/modelTraining.routes';
import dataPreprocessingRoutes from './routes/dataPreprocessing.routes';
import modelRegistryRoutes from './routes/modelRegistry.routes';
import monitoringRoutes from './routes/monitoring.routes';
import { responseTimeTracker } from './services/apiPerformance.service';
import { httpRequestCounter, httpRequestDurationMicroseconds } from './services/monitoring.service';

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
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
app.use('/api/listings', listingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/ai-content', aiContentRoutes);
app.use('/api/model-training', modelTrainingRoutes);
app.use('/api/data-preprocessing', dataPreprocessingRoutes);
app.use('/api/model-registry', modelRegistryRoutes);
app.use('/metrics', monitoringRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

export default app;
