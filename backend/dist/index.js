"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const dotenv = __importStar(require("dotenv"));
const database_1 = require("./config/database");
const passport_2 = __importDefault(require("./config/passport"));
const routes_1 = __importDefault(require("./routes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const publishingRoutes_1 = __importDefault(require("./routes/publishingRoutes"));
const socialMediaRoutes_1 = __importDefault(require("./routes/socialMediaRoutes"));
const photoRoutes_1 = __importDefault(require("./routes/photoRoutes"));
const seoRoutes_1 = __importDefault(require("./routes/seoRoutes"));
const voiceRoutes_1 = __importDefault(require("./routes/voiceRoutes"));
const aiRouting_routes_1 = __importDefault(require("./routes/aiRouting.routes"));
const predictiveMaintenance_routes_1 = __importDefault(require("./routes/predictiveMaintenance.routes"));
const costEstimation_routes_1 = __importDefault(require("./routes/costEstimation.routes"));
const vendorPerformance_routes_1 = __importDefault(require("./routes/vendorPerformance.routes"));
const photoAnalysis_routes_1 = __importDefault(require("./routes/photoAnalysis.routes"));
const maintenanceRequestCategorization_routes_1 = __importDefault(require("./routes/maintenanceRequestCategorization.routes"));
const emergencyRouting_routes_1 = __importDefault(require("./routes/emergencyRouting.routes"));
const maintenanceResponseTime_routes_1 = __importDefault(require("./routes/maintenanceResponseTime.routes"));
const scheduling_routes_1 = __importDefault(require("./routes/scheduling.routes"));
const riskAssessment_routes_1 = __importDefault(require("./routes/riskAssessment.routes"));
const tenantIssuePrediction_routes_1 = __importDefault(require("./routes/tenantIssuePrediction.routes"));
const expenseCategorization_routes_1 = __importDefault(require("./routes/expenseCategorization.routes"));
const cashFlowForecasting_routes_1 = __importDefault(require("./routes/cashFlowForecasting.routes"));
const roi_routes_1 = __importDefault(require("./routes/roi.routes"));
const taxDocument_routes_1 = __importDefault(require("./routes/taxDocument.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const legalNotice_routes_1 = __importDefault(require("./routes/legalNotice.routes"));
const signature_routes_1 = __importDefault(require("./routes/signature.routes"));
const knowledgeBase_routes_1 = __importDefault(require("./routes/knowledgeBase.routes"));
const appliance_routes_1 = __importDefault(require("./routes/appliance.routes"));
const businessHours_routes_1 = __importDefault(require("./routes/businessHours.routes"));
const emergencyProtocol_routes_1 = __importDefault(require("./routes/emergencyProtocol.routes"));
const escalationPolicy_routes_1 = __importDefault(require("./routes/escalationPolicy.routes"));
const onCall_routes_1 = __importDefault(require("./routes/onCall.routes"));
const whiteLabel_routes_1 = __importDefault(require("./routes/whiteLabel.routes"));
const apiKey_routes_1 = __importDefault(require("./routes/apiKey.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const language_routes_1 = __importDefault(require("./routes/language.routes"));
const translation_routes_1 = __importDefault(require("./routes/translation.routes"));
const sentiment_routes_1 = __importDefault(require("./routes/sentiment.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const webSocketService_1 = __importDefault(require("./services/webSocketService"));
const voicemailService_1 = __importDefault(require("./services/voicemailService"));
const aiOrchestrationService_1 = __importDefault(require("./services/aiOrchestrationService"));
const rentCollection_service_1 = require("./services/rentCollection.service");
const documentExpiration_service_1 = require("./services/documentExpiration.service");
// Load environment variables
dotenv.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // CORS configuration
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// Configure express-session
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
}));
// Initialize Passport and configure strategies
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
(0, passport_2.default)();
// Serve static files from the uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Register API routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/publishing', publishingRoutes_1.default);
app.use('/api/social-media', socialMediaRoutes_1.default);
app.use('/api/photo', photoRoutes_1.default);
app.use('/api/seo', seoRoutes_1.default);
app.use('/api/voice', voiceRoutes_1.default);
app.use('/api/ai-routing', aiRouting_routes_1.default);
app.use('/api/predictive-maintenance', predictiveMaintenance_routes_1.default);
app.use('/api/cost-estimation', costEstimation_routes_1.default);
app.use('/api/vendor-performance', vendorPerformance_routes_1.default);
app.use('/api/photo-analysis', photoAnalysis_routes_1.default);
app.use('/api/maintenance-request-categorization', maintenanceRequestCategorization_routes_1.default);
app.use('/api/emergency-routing', emergencyRouting_routes_1.default);
app.use('/api/maintenance-response-time', maintenanceResponseTime_routes_1.default);
app.use('/api/scheduling', scheduling_routes_1.default);
app.use('/api/risk-assessment', riskAssessment_routes_1.default);
app.use('/api/tenant-issue-prediction', tenantIssuePrediction_routes_1.default);
app.use('/api/expense-categorization', expenseCategorization_routes_1.default);
app.use('/api/cash-flow-forecasting', cashFlowForecasting_routes_1.default);
app.use('/api/roi', roi_routes_1.default);
app.use('/api/tax-document', taxDocument_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/legal-notices', legalNotice_routes_1.default);
app.use('/api/signatures', signature_routes_1.default);
app.use('/api/knowledge-base', knowledgeBase_routes_1.default);
app.use('/api/appliances', appliance_routes_1.default);
app.use('/api/business-hours', businessHours_routes_1.default);
app.use('/api/emergency-protocols', emergencyProtocol_routes_1.default);
app.use('/api/escalation-policies', escalationPolicy_routes_1.default);
app.use('/api/on-call', onCall_routes_1.default);
app.use('/api/white-label', whiteLabel_routes_1.default);
app.use('/api/api-keys', apiKey_routes_1.default);
app.use('/api/roles', role_routes_1.default);
app.use('/api/languages', language_routes_1.default);
app.use('/api/translation', translation_routes_1.default);
app.use('/api/sentiment', sentiment_routes_1.default);
app.use('/api/conversations', conversation_routes_1.default);
app.use(routes_1.default);
// Global error handler
app.use((err, req, res, next) => {
    if (err.name === 'RateLimitExceeded') {
        console.warn(`Rate limit exceeded for IP ${req.ip}: ${err.message}`);
    }
    else {
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
        await (0, database_1.connectMongoDB)();
        console.log('Connected to MongoDB');
        // Set up MongoDB with security and performance settings
        await (0, database_1.setupMongoDB)();
        console.log('MongoDB setup and configuration completed');
        // Connect to PostgreSQL via Prisma
        await database_1.prisma.$connect();
        console.log('Connected to PostgreSQL via Prisma');
        // Set up PostgreSQL with security and performance settings
        await (0, database_1.setupPostgreSQL)();
        console.log('PostgreSQL setup and configuration completed');
        // Create HTTP server
        const server = http_1.default.createServer(app);
        // Initialize WebSocket service
        new webSocketService_1.default(server);
        // Initialize Voicemail service
        new voicemailService_1.default(path_1.default.join(__dirname, '../voicemails'), aiOrchestrationService_1.default);
        // Initialize Rent Collection service
        rentCollection_service_1.rentCollectionService.initialize();
        // Initialize Document Expiration service
        documentExpiration_service_1.documentExpirationService.initialize();
        // Start the server
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await (0, database_1.closeDatabaseConnections)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    await (0, database_1.closeDatabaseConnections)();
    process.exit(0);
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map