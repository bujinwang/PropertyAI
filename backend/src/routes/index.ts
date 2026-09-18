import express from 'express';
import propertyRoutes from './propertyRoutes';
import unitRoutes from './unitRoutes';
import rentalRoutes from './rentalRoutes';
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
import tenantRoutes from './tenantRoutes';
import tenantAnalyticsRoutes from './tenantAnalyticsRoutes';
import leaseRoutes from './leaseRoutes';
import maintenanceRoutes from './maintenanceRoutes';
import transactionRoutes from './transactionRoutes';
import passwordResetRoutes from './passwordResetRoutes';
import aiRoutes from './ai.routes'; // ✅ Changed from './aiRoutes'
import knowledgeBaseRoutes from './knowledgeBaseRoutes';
import suggestionRoutes from './suggestionRoutes';
import transcriptionRoutes from './transcriptionRoutes';
import documentVerificationRoutes from './documentVerificationRoutes';
import manualReviewRoutes from './manualReviewRoutes';
import notificationRoutes from './notificationRoutes';
import vendorPerformanceRoutes from './vendorPerformanceRoutes';
import backgroundCheckRoutes from './backgroundCheckRoutes';
import auditRoutes from './auditRoutes';
import paymentRoutes from './paymentRoutes';
import vendorPaymentRoutes from './vendorPayment.routes';
import reminderRoutes from './reminderRoutes';
import vendorRoutes from './vendor.routes';
import predictiveMaintenanceRoutes from './predictiveMaintenance.routes';
import modelPerformanceRoutes from './modelPerformance.routes';
// import photoAnalysisRoutes from './photoAnalysis.routes';
import { rateLimiter } from '../middleware/rateLimitMiddleware';
import { RequestHandler } from 'express';
import databaseOptimizationRoutes from './databaseOptimization.routes';
import tenantRatingRoutes from './tenantRating.routes';
import propertyDescriptionRoutes from './propertyDescription.routes';
import pricingRoutes from './pricing.routes';
import photoEnhancementRoutes from './photoEnhancement.routes';
import seoRoutes from './seo.routes';
import publishingRoutes from './publishing.routes';
import legacyPublishingRoutes from './publishingRoutes';
import { clearCache } from '../utils/cache';
import contractorRoutes from './contractor.routes';
import managerRoutes from './manager.routes';
import publicListingRoutes from './publicListing.routes';
import uxReviewRoutes from './uxReview.routes';
import marketingRoutes from './marketing.routes';
import marketIntelligenceRoutes from './marketIntelligence.routes';
import alertGroupsRoutes from './alertGroups.routes';
import templatesRoutes from './templates.routes';
// import approvalWorkflowRoutes from './approvalWorkflow.routes';
// import workflowAutomationRoutes from './workflowAutomation.routes';

const router = express.Router();

// API version prefix
const API_PREFIX = '/api';

router.use(rateLimiter as unknown as RequestHandler);

// Health check endpoint
router.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Register routes
// NEW: Rental routes (unified model)
router.use(`${API_PREFIX}/rentals`, rentalRoutes); // New unified rental management routes

// LEGACY: Keep existing routes for backward compatibility during transition
router.use(`${API_PREFIX}/properties`, propertyRoutes);
router.use(`${API_PREFIX}/units`, unitRoutes);
router.use(`${API_PREFIX}`, imageRoutes); // Image routes handle both property and unit images
router.use(`${API_PREFIX}/search`, searchRoutes); // Search routes for advanced filtering
router.use(`${API_PREFIX}/geocoding`, geocodingRoutes); // Geocoding and address validation routes
// `publicListingRoutes` MUST be mounted before `listingRoutes`: both live under
// `/api/listings`, and `listingRoutes` declares `GET /:id` behind
// `authMiddleware.protect`. Mounted first it would capture `/api/listings/public`
// with `:id="public"` and 401 the public listing endpoint before this router is
// ever reached. (Same class of ordering bug as the app.ts barrel shadowing.)
router.use(`${API_PREFIX}/listings`, publicListingRoutes); // Public marketplace listings (anonymous)
router.use(`${API_PREFIX}/listings`, listingRoutes); // Property listing management routes (authenticated)
router.use(`${API_PREFIX}/applications`, applicationRoutes); // Tenant application routes
router.use(`${API_PREFIX}/ai-content`, aiContentRoutes); // AI-generated content routes
router.use(`${API_PREFIX}/auth`, authRoutes); // Primary authentication routes
router.use(`${API_PREFIX}/auth`, oauthRoutes); // OAuth routes for Google authentication
router.use(`${API_PREFIX}/mfa`, mfaRoutes); // Multi-factor authentication routes
router.use(`${API_PREFIX}/users`, usersRoutes); // User management routes with inter-service endpoints
router.use(`${API_PREFIX}/tenants`, tenantRoutes);
router.use(`${API_PREFIX}/tenant`, tenantAnalyticsRoutes); // NEW: Tenant sentiment analytics routes
router.use(`${API_PREFIX}/leases`, leaseRoutes);
router.use(`${API_PREFIX}/maintenance`, maintenanceRoutes);
router.use(`${API_PREFIX}/transactions`, transactionRoutes);
router.use(`${API_PREFIX}/publish`, legacyPublishingRoutes);
router.use(`${API_PREFIX}/password-reset`, passwordResetRoutes);
router.use(`${API_PREFIX}/ai`, aiRoutes);
router.use(`${API_PREFIX}/knowledge-base`, knowledgeBaseRoutes);
router.use(`${API_PREFIX}/suggestions`, suggestionRoutes);
router.use(`${API_PREFIX}/transcriptions`, transcriptionRoutes);
router.use(`${API_PREFIX}/document-verification`, documentVerificationRoutes);
router.use(`${API_PREFIX}/manual-review`, manualReviewRoutes);
router.use(`${API_PREFIX}/notifications`, notificationRoutes);
router.use(`${API_PREFIX}/vendor-performance`, vendorPerformanceRoutes);
router.use(`${API_PREFIX}/background-checks`, backgroundCheckRoutes);
router.use(`${API_PREFIX}/audit`, auditRoutes);
router.use(`${API_PREFIX}/vendor-payments`, vendorPaymentRoutes);
// Stripe billing router (customers / payment-intents / subscriptions / refunds /
// invoices / webhooks …). Previously imported (line 31) but never mounted, so TS
// elided the import and the whole router never loaded. Mounting it here both
// wires the 14 routes and makes the import genuinely used. This is additive to
// the dotted `payment.routes.ts` mounted at app.ts:179 under the same
// `/api/payments` prefix: the two routers' path sets are disjoint. Every
// non-webhook route carries its own isAuthenticated + checkRole guard.
router.use(`${API_PREFIX}/payments`, paymentRoutes);
router.use(`${API_PREFIX}/reminders`, reminderRoutes);
router.use(`${API_PREFIX}/vendors`, vendorRoutes);
router.use(`${API_PREFIX}/predictive-maintenance`, predictiveMaintenanceRoutes);
router.use(`${API_PREFIX}/model-performance`, modelPerformanceRoutes);
router.use(`${API_PREFIX}/database`, databaseOptimizationRoutes);
// router.use(`${API_PREFIX}/photo-analysis`, photoAnalysisRoutes);
router.use(`${API_PREFIX}/property-descriptions`, propertyDescriptionRoutes);
router.use(`${API_PREFIX}/pricing`, pricingRoutes);
router.use(`${API_PREFIX}/photo-enhancement`, photoEnhancementRoutes);
router.use(`${API_PREFIX}/seo`, seoRoutes);
router.use(`${API_PREFIX}/publishing`, publishingRoutes);
router.use(`${API_PREFIX}/contractor`, contractorRoutes);
router.use(`${API_PREFIX}/manager`, managerRoutes);
router.use(`${API_PREFIX}/ux-review`, uxReviewRoutes);
router.use(`${API_PREFIX}/marketing`, marketingRoutes);
router.use(`${API_PREFIX}/tenant-ratings`, tenantRatingRoutes);
router.use(`${API_PREFIX}/market-intelligence`, marketIntelligenceRoutes);

// Epic 23: Alert Groups and User Templates API routes
router.use(`${API_PREFIX}/alert-groups`, alertGroupsRoutes);
router.use(`${API_PREFIX}/templates`, templatesRoutes);

// router.use(`${API_PREFIX}/workflows/automation`, workflowAutomationRoutes);

router.post(`${API_PREFIX}/cache/clear`, (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Cache key is required' });
  }
  clearCache(key);
  res.status(200).json({ message: `Cache for key ${key} cleared` });
});

// 404 handler for API routes.
//
// CAUTION: this is a terminal handler — it responds and does NOT call `next()`.
// Anything mounted on the app *after* this barrel (`app.use(routes)`) is therefore
// permanently unreachable (this previously shadowed 36 route mounts). Keep
// `app.use(routes)` as the LAST route mount in app.ts, before the error handler.
router.use(`${API_PREFIX}/*`, (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

export default router;
