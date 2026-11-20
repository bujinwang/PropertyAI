import express from 'express';
import { UserRole } from '@prisma/client';
import * as marketingController from '../controllers/marketingController';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkRole } from '../middleware/auth';

/**
 * Marketing surface — campaigns, promotions, syndication, analytics.
 *
 * WHY THE ROLE GATE IS HERE
 * -------------------------
 * This router previously applied `authMiddleware.protect` to everything and
 * NOTHING else. The controller never read `req.user` at all (0 occurrences
 * across 769 lines), which means the entire surface was authenticated-but-
 * unauthorized: any tenant holding a token could edit campaign budgets, delete
 * promotions, and rewrite syndication credentials.
 *
 * A role gate is the right control for these rows because they are GLOBAL —
 * marketing spend and promo codes are not owned by any particular rental, so
 * there is no row for a per-row ownership check to bind to. (Contrast
 * `/api/rentals` et al., where `checkRole` genuinely cannot answer "is this
 * yours?" and the decision must live in the controller.)
 *
 * Reads stay open to any authenticated user: the dashboard's marketing pages are
 * read by staff who are not operators, and no tenant data is exposed. The one
 * thing reads must NOT do is return syndication secrets — enforced in the
 * controller via `SAFE_PLATFORM_SELECT`, not here.
 */
const router = express.Router();

// Authentication for everything on this surface.
router.use(authMiddleware.protect);

/** Roles permitted to MUTATE marketing data. */
const MARKETING_WRITERS: UserRole[] = [
  UserRole.ADMIN,
  UserRole.PROPERTY_MANAGER,
  UserRole.OWNER,
];

/** Roles permitted to trigger outbound syndication (side effects on 3rd parties). */
const SYNDICATION_OPERATORS: UserRole[] = [UserRole.ADMIN, UserRole.PROPERTY_MANAGER];

const canWrite = checkRole(MARKETING_WRITERS);
const canSync = checkRole(SYNDICATION_OPERATORS);

// Campaign routes
router.get('/campaigns', marketingController.getCampaigns);
router.post('/campaigns', canWrite, marketingController.createCampaign);
router.get('/campaigns/:id', marketingController.getCampaign);
router.put('/campaigns/:id', canWrite, marketingController.updateCampaign);
router.delete('/campaigns/:id', canWrite, marketingController.deleteCampaign);
router.post('/campaigns/:id/pause', canWrite, marketingController.pauseCampaign);
router.post('/campaigns/:id/resume', canWrite, marketingController.resumeCampaign);

// Analytics routes
router.get('/analytics/overview', marketingController.getAnalyticsOverview);
router.get('/analytics/traffic', marketingController.getWebsiteTraffic);
router.get('/analytics/lead-sources', marketingController.getLeadSources);
router.get('/analytics/property-performance', marketingController.getPropertyPerformance);
router.get('/analytics/conversion-funnel', marketingController.getConversionFunnel);

// Promotion routes
router.get('/promotions', marketingController.getPromotions);
router.post('/promotions', canWrite, marketingController.createPromotion);
router.get('/promotions/:id', marketingController.getPromotion);
router.put('/promotions/:id', canWrite, marketingController.updatePromotion);
router.delete('/promotions/:id', canWrite, marketingController.deletePromotion);
router.post('/promotions/:id/activate', canWrite, marketingController.activatePromotion);
router.post('/promotions/:id/deactivate', canWrite, marketingController.deactivatePromotion);
// Deliberately open to any authenticated user: this is the code-redemption check
// called from the checkout flow, not a management action.
router.post('/promotions/validate-code', marketingController.validatePromotionCode);

// Syndication routes
router.get('/syndication/platforms', marketingController.getSyndicationPlatforms);
router.put(
  '/syndication/platforms/:id',
  canSync,
  marketingController.updateSyndicationPlatform
);
router.post('/syndication/platforms/:id/sync', canSync, marketingController.syncPlatform);
router.post('/syndication/sync-all', canSync, marketingController.syncAllPlatforms);
router.get('/syndication/activity', marketingController.getSyncActivity);

export default router;
