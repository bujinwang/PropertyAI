import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import './tracing';
import * as dotenv from 'dotenv';
import { prisma, connectMongoDB, setupPostgreSQL, setupMongoDB, closeDatabaseConnections } from './config/database';
import configurePassport from './config/passport';
import routes from './routes';
import authRoutes from './routes/authRoutes';
import aiRoutes from './routes/aiRoutes';
import publishingRoutes from './routes/publishingRoutes';
import socialMediaRoutes from './routes/socialMediaRoutes';
import photoRoutes from './routes/photoRoutes';
import seoRoutes from './routes/seoRoutes';
import voiceRoutes from './routes/voiceRoutes';
import aiRoutingRoutes from './routes/aiRouting.routes';
import predictiveMaintenanceRoutes from './routes/predictiveMaintenance.routes';
import costEstimationRoutes from './routes/costEstimation.routes';
import vendorPerformanceRoutes from './routes/vendorPerformance.routes';
import photoAnalysisRoutes from './routes/photoAnalysis.routes';
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
import paymentRoutes from './routes/payment.routes';
import documentRoutes from './routes/document.routes';
import legalNoticeRoutes from './routes/legalNotice.routes';
import signatureRoutes from './routes/signature.routes';
import knowledgeBaseRoutes from './routes/knowledgeBase.routes';
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
import WebSocketService from './services/webSocketService';
import VoicemailService from './services/voicemailService';
import aiOrchestrationService from './services/aiOrchestrationService';
import { rentCollectionService } from './services/rentCollection.service';
import { documentExpirationService } from './services/documentExpiration.service';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS configuration
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/publishing', publishingRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/photo', photoRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/ai-routing', aiRoutingRoutes);
app.use('/api/predictive-maintenance', predictiveMaintenanceRoutes);
app.use('/api/cost-estimation', costEstimationRoutes);
app.use('/api/vendor-performance', vendorPerformanceRoutes);
app.use('/api/photo-analysis', photoAnalysisRoutes);
app.use(
  '/api/maintenance-request-categorization',
  maintenanceRequestCategorizationRoutes
);
app.use('/api/emergency-routing', emergencyRoutingRoutes);
app.use('/api/maintenance-response-time', maintenanceResponseTimeRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/risk-assessment', riskAssessmentRoutes);
app.use('/api/tenant-issue-prediction', tenantIssuePredictionRoutes);
app.use('/api/expense-categorization', expenseCategorizationRoutes);
app.use('/api/cash-flow-forecasting', cashFlowForecastingRoutes);
app.use('/api/roi', roiRoutes);
app.use('/api/tax-document', taxDocumentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/legal-notices', legalNoticeRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
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
app.use(routes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.name === 'RateLimitExceeded') {
    console.warn(`Rate limit exceeded for IP ${req.ip}: ${err.message}`);
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
    
    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket service
    new WebSocketService(server);

    // Initialize Voicemail service
    new VoicemailService(path.join(__dirname, '../voicemails'), aiOrchestrationService);
    
    // Initialize Rent Collection service
    rentCollectionService.initialize();

    // Initialize Document Expiration service
    documentExpirationService.initialize();

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await closeDatabaseConnections();
  process.exit(0);
});

// Start the server
startServer();
