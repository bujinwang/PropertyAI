"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const propertyRoutes_1 = __importDefault(require("./propertyRoutes"));
const unitRoutes_1 = __importDefault(require("./unitRoutes"));
const imageRoutes_1 = __importDefault(require("./imageRoutes"));
const searchRoutes_1 = __importDefault(require("./searchRoutes"));
const geocodingRoutes_1 = __importDefault(require("./geocodingRoutes"));
const listingRoutes_1 = __importDefault(require("./listingRoutes"));
const applicationRoutes_1 = __importDefault(require("./applicationRoutes"));
const aiContentRoutes_1 = __importDefault(require("./aiContentRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const oauthRoutes_1 = __importDefault(require("./oauthRoutes"));
const mfaRoutes_1 = __importDefault(require("./mfaRoutes"));
const usersRoutes_1 = __importDefault(require("./usersRoutes"));
const tenantRoutes_1 = __importDefault(require("./tenantRoutes"));
const leaseRoutes_1 = __importDefault(require("./leaseRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./maintenanceRoutes"));
const transactionRoutes_1 = __importDefault(require("./transactionRoutes"));
const publishingRoutes_1 = __importDefault(require("./publishingRoutes"));
const passwordResetRoutes_1 = __importDefault(require("./passwordResetRoutes"));
const aiRoutes_1 = __importDefault(require("./aiRoutes"));
const knowledgeBaseRoutes_1 = __importDefault(require("./knowledgeBaseRoutes"));
const suggestionRoutes_1 = __importDefault(require("./suggestionRoutes"));
const transcriptionRoutes_1 = __importDefault(require("./transcriptionRoutes"));
const documentVerificationRoutes_1 = __importDefault(require("./documentVerificationRoutes"));
const manualReviewRoutes_1 = __importDefault(require("./manualReviewRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const vendorPerformanceRoutes_1 = __importDefault(require("./vendorPerformanceRoutes"));
const backgroundCheckRoutes_1 = __importDefault(require("./backgroundCheckRoutes"));
const auditRoutes_1 = __importDefault(require("./auditRoutes"));
const paymentRoutes_1 = __importDefault(require("./paymentRoutes"));
const reminderRoutes_1 = __importDefault(require("./reminderRoutes"));
const rateLimitMiddleware_1 = require("../middleware/rateLimitMiddleware");
const databaseOptimization_routes_1 = __importDefault(require("./databaseOptimization.routes"));
const router = express_1.default.Router();
// API version prefix
const API_PREFIX = '/api';
router.use(API_PREFIX, rateLimitMiddleware_1.rateLimiter);
// Health check endpoint
router.get(`${API_PREFIX}/health`, (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});
// Register routes
router.use(`${API_PREFIX}/properties`, propertyRoutes_1.default);
router.use(`${API_PREFIX}/units`, unitRoutes_1.default);
router.use(`${API_PREFIX}`, imageRoutes_1.default); // Image routes handle both property and unit images
router.use(`${API_PREFIX}/search`, searchRoutes_1.default); // Search routes for advanced filtering
router.use(`${API_PREFIX}/geocoding`, geocodingRoutes_1.default); // Geocoding and address validation routes
router.use(`${API_PREFIX}/listings`, listingRoutes_1.default); // Property listing management routes
router.use(`${API_PREFIX}/applications`, applicationRoutes_1.default); // Tenant application routes
router.use(`${API_PREFIX}/ai-content`, aiContentRoutes_1.default); // AI-generated content routes
router.use(`${API_PREFIX}/auth`, authRoutes_1.default); // Primary authentication routes
router.use(`${API_PREFIX}/auth`, oauthRoutes_1.default); // OAuth routes for Google authentication
router.use(`${API_PREFIX}/mfa`, mfaRoutes_1.default); // Multi-factor authentication routes
router.use(`${API_PREFIX}/users`, usersRoutes_1.default); // User management routes with inter-service endpoints
router.use(`${API_PREFIX}/tenants`, tenantRoutes_1.default);
router.use(`${API_PREFIX}/leases`, leaseRoutes_1.default);
router.use(`${API_PREFIX}/maintenance`, maintenanceRoutes_1.default);
router.use(`${API_PREFIX}/transactions`, transactionRoutes_1.default);
router.use(`${API_PREFIX}/publish`, publishingRoutes_1.default);
router.use(`${API_PREFIX}/password-reset`, passwordResetRoutes_1.default);
router.use(`${API_PREFIX}/ai`, aiRoutes_1.default);
router.use(`${API_PREFIX}/knowledge-base`, knowledgeBaseRoutes_1.default);
router.use(`${API_PREFIX}/suggestions`, suggestionRoutes_1.default);
router.use(`${API_PREFIX}/transcriptions`, transcriptionRoutes_1.default);
router.use(`${API_PREFIX}/document-verification`, documentVerificationRoutes_1.default);
router.use(`${API_PREFIX}/manual-review`, manualReviewRoutes_1.default);
router.use(`${API_PREFIX}/notifications`, notificationRoutes_1.default);
router.use(`${API_PREFIX}/vendor-performance`, vendorPerformanceRoutes_1.default);
router.use(`${API_PREFIX}/background-checks`, backgroundCheckRoutes_1.default);
router.use(`${API_PREFIX}/audit`, auditRoutes_1.default);
router.use(`${API_PREFIX}/payments`, paymentRoutes_1.default);
router.use(`${API_PREFIX}/reminders`, reminderRoutes_1.default);
router.use(`${API_PREFIX}/database`, databaseOptimization_routes_1.default);
// 404 handler for API routes
router.use(`${API_PREFIX}/*`, (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'API endpoint not found'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map