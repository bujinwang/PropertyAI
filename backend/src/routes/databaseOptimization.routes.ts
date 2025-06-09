import express from 'express';
import { databaseOptimizationController, DatabaseOptimizationController } from '../controllers/databaseOptimization.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = express.Router();

/**
 * Apply rate limiting middleware to all database optimization routes
 */
router.use(DatabaseOptimizationController.rateLimiter);

/**
 * @route   GET /api/db-optimization/slow-queries
 * @desc    Analyze slow queries in PostgreSQL and MongoDB
 * @access  Admin only
 */
router.get(
  '/slow-queries',
  authMiddleware.requireAdmin,
  databaseOptimizationController.analyzeSlowQueries
);

/**
 * @route   POST /api/db-optimization/missing-indexes
 * @desc    Identify and create missing indexes
 * @access  Admin only
 * @param   {boolean} [execute] - Optional. If true, actually create the suggested indexes. If false or omitted, only suggestions are returned. Can be passed as a query param (?execute=true) or in the JSON body.
 */
router.post(
  '/missing-indexes',
  authMiddleware.requireAdmin,
  databaseOptimizationController.createMissingIndexes
);

/**
 * @route   POST /api/db-optimization/optimize-connections
 * @desc    Optimize database connections
 * @access  Admin only
 */
router.post(
  '/optimize-connections',
  authMiddleware.requireAdmin,
  databaseOptimizationController.optimizeConnections
);

/**
 * @route   POST /api/db-optimization/vacuum-analyze
 * @desc    Run VACUUM ANALYZE on PostgreSQL
 * @access  Admin only
 */
router.post(
  '/vacuum-analyze',
  authMiddleware.requireAdmin,
  databaseOptimizationController.runVacuumAnalyze
);

/**
 * @route   GET /api/db-optimization/metrics
 * @desc    Get database performance metrics
 * @access  Admin only
 */
router.get(
  '/metrics',
  authMiddleware.requireAdmin,
  databaseOptimizationController.getDatabaseMetrics
);

/**
 * @route   GET /api/db-optimization/unused-indexes
 * @desc    Detect unused and redundant indexes
 * @access  Admin only
 */
router.get(
  '/unused-indexes',
  authMiddleware.requireAdmin,
  databaseOptimizationController.detectUnusedIndexes
);

/**
 * @route   GET /api/db-optimization/query-plans
 * @desc    Analyze query execution plans
 * @access  Admin only
 * @param   {boolean} [compare] - Optional. If 'false', don't compare with previous plans. Default is true.
 */
router.get(
  '/query-plans',
  authMiddleware.requireAdmin,
  databaseOptimizationController.analyzeQueryPlans
);

/**
 * @route   GET /api/db-optimization/health-check
 * @desc    Run a quick health check on both PostgreSQL and MongoDB databases
 * @access  Admin only
 */
router.get(
  '/health-check',
  authMiddleware.requireAdmin,
  databaseOptimizationController.runHealthCheck
);

export default router; 