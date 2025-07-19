import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
// import './tracing';
import * as dotenv from 'dotenv';
import { prisma, connectMongoDB, setupPostgreSQL, setupMongoDB, closeDatabaseConnections } from './config/database';
import configurePassport from './config/passport';
import routes from './routes';
// Import only routes that are NOT in the centralized routes file
import socialMediaRoutes from './routes/socialMediaRoutes';
import photoRoutes from './routes/photoRoutes';
import voiceRoutes from './routes/voiceRoutes';
import aiRoutingRoutes from './routes/aiRouting.routes';
import costEstimationRoutes from './routes/costEstimation.routes';
import maintenanceRequestCategorizationRoutes from './routes/maintenanceRequestCategorization.routes';
import emergencyRoutingRoutes from './routes/emergencyRouting.routes';
import maintenanceResponseTimeRoutes from './routes/maintenanceResponseTime.routes';
import schedulingRoutes from './routes/scheduling.routes';
import riskAssessmentRoutes from './routes/riskAssessment.routes';
import tenantIssuePredictionRoutes from './routes/tenantIssuePrediction.routes';
import expenseCategorizationRoutes from './routes/expenseCategorization.routes';
import cashFlowForecastingRoutes from './routes/cashFlowForecasting.routes';
import roiRoutes from './routes/roi.routes';
import taxDocumentRoutes from './routes/taxDocument.routes';
import documentRoutes from './routes/document.routes';
import legalNoticeRoutes from './routes/legalNotice.routes';
import signatureRoutes from './routes/signature.routes';
import applianceRoutes from './routes/appliance.routes';
import businessHoursRoutes from './routes/businessHours.routes';
import emergencyProtocolRoutes from './routes/emergencyProtocol.routes';
import escalationPolicyRoutes from './routes/escalationPolicy.routes';
import onCallRoutes from './routes/onCall.routes';
import whiteLabelRoutes from './routes/whiteLabel.routes';
import apiKeyRoutes from './routes/apiKey.routes';
import roleRoutes from './routes/role.routes';
import languageRoutes from './routes/language.routes';
import translationRoutes from './routes/translation.routes';
import sentimentRoutes from './routes/sentiment.routes';
import conversationRoutes from './routes/conversation.routes';
import path from 'path';
import http from 'http';
import { initializeWebSocket } from './services/webSocket.service';
import VoicemailService from './services/voicemailService';
import { aiOrchestrationService } from './services/aiOrchestration.service';
import { rentCollectionService } from './services/rentCollection.service';
import { documentExpirationService } from './services/documentExpiration.service';
import './services/pubSub.service';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

const PORT = process.env.PORT || 3001;

// Global server reference for graceful shutdown (moved to top)
let globalServer: http.Server | null = null;

// Middleware - Order is important!
app.use(helmet()); // Security headers

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', // Dashboard
    'http://localhost:5000', // PropertyApp frontend
    'http://localhost:5001', // Backend API
    'http://localhost:8081', // Expo web app
    'exp://localhost:19000', // Expo development
    'http://localhost:19006' // Expo web alternative port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser configuration - MUST be before routes
// Enhanced configuration to handle large payloads
app.use(express.json({ 
  limit: '100mb',
  parameterLimit: 50000,
  type: ['application/json', 'text/plain']
})); // Parse JSON bodies with increased limit
app.use(express.urlencoded({ 
  extended: true, 
  limit: '100mb',
  parameterLimit: 50000
})); // Parse URL-encoded bodies with increased limit

// Configure express-session
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
}));

// Initialize Passport and configure strategies
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register API routes
// First, use the centralized routes (includes /api prefix)
app.use(routes);

// Then add routes that are NOT in the centralized routes file
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/photo', photoRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/ai-routing', aiRoutingRoutes);
app.use('/api/cost-estimation', costEstimationRoutes);
app.use('/api/maintenance-request-categorization', maintenanceRequestCategorizationRoutes);
app.use('/api/emergency-routing', emergencyRoutingRoutes);
app.use('/api/maintenance-response-time', maintenanceResponseTimeRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/risk-assessment', riskAssessmentRoutes);
app.use('/api/tenant-issue-prediction', tenantIssuePredictionRoutes);
app.use('/api/expense-categorization', expenseCategorizationRoutes);
app.use('/api/cash-flow-forecasting', cashFlowForecastingRoutes);
app.use('/api/roi', roiRoutes);
app.use('/api/tax-document', taxDocumentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/legal-notices', legalNoticeRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/appliances', applianceRoutes);
app.use('/api/business-hours', businessHoursRoutes);
app.use('/api/emergency-protocols', emergencyProtocolRoutes);
app.use('/api/escalation-policies', escalationPolicyRoutes);
app.use('/api/on-call', onCallRoutes);
app.use('/api/white-label', whiteLabelRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/conversations', conversationRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.name === 'RateLimitExceeded') {
    console.warn(`Rate limit exceeded for IP ${req.ip}: ${err.message}`);
  } else if (err.type === 'entity.too.large') {
    console.error('Payload too large error:', err);
    return res.status(413).json({
      status: 'error',
      message: 'Request payload too large. Maximum allowed size is 100MB.',
      limit: '100MB',
      received: err.length ? `${Math.round(err.length / 1024)}KB` : 'unknown'
    });
  } else {
    console.error('Unhandled error:', err);
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('Connected to MongoDB');
    
    // Set up MongoDB with security and performance settings
    await setupMongoDB();
    console.log('MongoDB setup and configuration completed');
    
    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma');
    
    // Set up PostgreSQL with security and performance settings
    await setupPostgreSQL();
    console.log('PostgreSQL setup and configuration completed');
    
    // Initialize Voicemail service
    new VoicemailService(path.join(__dirname, '../voicemails'));
    
    // Initialize Rent Collection service
    rentCollectionService.initialize();

    // Initialize Document Expiration service
    documentExpirationService.initialize();

    // Start the server with proper cleanup to prevent race conditions
    const startListening = (port: number) => {
      // Clean up any existing server instance
      if (globalServer) {
        globalServer.removeAllListeners();
        if (globalServer.listening) {
          globalServer.close();
        }
      }
      
      // Create a fresh server instance for each attempt
      const serverInstance = http.createServer(app);
      
      // Re-initialize WebSocket service with the new server instance
      initializeWebSocket(serverInstance);
      
      const onError = (err: NodeJS.ErrnoException) => {
        // Remove listeners to prevent memory leaks
        serverInstance.removeAllListeners();
        
        if (err.code === 'EADDRINUSE' && process.env.NODE_ENV !== 'production') {
          console.log(`Port ${port} is busy, trying port ${port + 1}...`);
          // Use setTimeout to prevent stack overflow in rapid succession
          setTimeout(() => startListening(port + 1), 100);
        } else {
          console.error(`Failed to start server on port ${port}: ${err.message}`);
          process.exit(1);
        }
      };

      const onListening = () => {
        // Assign to global reference only on successful startup
        globalServer = serverInstance;
        console.log(`Server successfully started on port ${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      };

      // Attach error listener BEFORE calling listen to prevent unhandled errors
      serverInstance.on('error', onError);
      serverInstance.once('listening', onListening);
      
      // Start listening
      serverInstance.listen(port);
    };

    startListening(Number(PORT));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  if (globalServer && globalServer.listening) {
    globalServer.close(() => {
      console.log('Server closed.');
    });
  }
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  if (globalServer && globalServer.listening) {
    globalServer.close(() => {
      console.log('Server closed.');
    });
  }
  await closeDatabaseConnections();
  process.exit(0);
});

// Start the server
startServer();
