import { Request, Response } from 'express';
import { databaseOptimizationService } from '../services/databaseOptimization.service';
import rateLimit from 'express-rate-limit';

/**
 * Controller for database optimization endpoints
 */
export class DatabaseOptimizationController {
  /**
   * Rate limiter middleware for database optimization endpoints
   * Limits to 10 requests per 15 minutes per IP
   */
  public static rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many database optimization requests, please try again later',
  });

  /**
   * Analyze slow queries in PostgreSQL and MongoDB
   */
  public async analyzeSlowQueries(req: Request, res: Response): Promise<void> {
    try {
      const postgresQueries = await databaseOptimizationService.analyzePostgresSlowQueries();
      const mongoQueries = await databaseOptimizationService.analyzeMongoSlowQueries();
      
      res.status(200).json({
        postgres: postgresQueries,
        mongodb: mongoQueries
      });
    } catch (error: any) {
      console.error('Error analyzing slow queries:', error?.message || error);
      res.status(500).json({ 
        message: 'Error analyzing slow queries', 
        error: error?.message || String(error)
      });
    }
  }
  
  /**
   * Identify and create missing indexes
   * @param req.query.execute (optional) If true, actually create the suggested indexes (default: false)
   * @returns JSON with actionable index suggestions or creation results
   */
  public async createMissingIndexes(req: Request, res: Response): Promise<void> {
    try {
      // Accept 'execute' flag from query or body (default: false)
      const execute = req.query.execute === 'true' || req.body.execute === true;
      const createdIndexes = await databaseOptimizationService.createMissingIndexes(execute);
      res.status(200).json({
        message: execute ? 'Index creation completed' : 'Index suggestion completed',
        execute,
        results: createdIndexes
      });
    } catch (error: any) {
      console.error('Error creating missing indexes:', error?.message || error);
      res.status(500).json({ 
        message: 'Error creating missing indexes', 
        error: error?.message || String(error)
      });
    }
  }
  
  /**
   * Optimize database connections
   */
  public async optimizeConnections(req: Request, res: Response): Promise<void> {
    try {
      await databaseOptimizationService.optimizeConnections();
      
      res.status(200).json({
        message: 'Database connections optimized successfully'
      });
    } catch (error) {
      console.error('Error optimizing connections:', error);
      res.status(500).json({ 
        message: 'Error optimizing database connections', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Run VACUUM ANALYZE on PostgreSQL
   */
  public async runVacuumAnalyze(req: Request, res: Response): Promise<void> {
    try {
      await databaseOptimizationService.runVacuumAnalyze();
      
      res.status(200).json({
        message: 'VACUUM ANALYZE completed successfully'
      });
    } catch (error) {
      console.error('Error running VACUUM ANALYZE:', error);
      res.status(500).json({ 
        message: 'Error running VACUUM ANALYZE', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get database performance metrics
   */
  public async getDatabaseMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await databaseOptimizationService.getDatabaseMetrics();
      
      res.status(200).json(metrics);
    } catch (error) {
      console.error('Error getting database metrics:', error);
      res.status(500).json({ 
        message: 'Error getting database metrics', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Detect unused and redundant indexes
   */
  public async detectUnusedIndexes(req: Request, res: Response): Promise<void> {
    try {
      const unusedIndexes = await databaseOptimizationService.detectUnusedIndexes();
      
      res.status(200).json({
        message: 'Unused and redundant indexes detected',
        count: unusedIndexes.length,
        indexes: unusedIndexes
      });
    } catch (error: any) {
      console.error('Error detecting unused indexes:', error?.message || error);
      res.status(500).json({ 
        message: 'Error detecting unused indexes', 
        error: error?.message || String(error)
      });
    }
  }
  
  /**
   * Analyze query execution plans
   * @param req.query.compare (optional) If 'true', compare with previous plans to detect regressions (default: true)
   */
  public async analyzeQueryPlans(req: Request, res: Response): Promise<void> {
    try {
      const compareWithPrevious = req.query.compare !== 'false';
      const results = await databaseOptimizationService.analyzeQueryPlans(compareWithPrevious);
      
      res.status(200).json({
        message: 'Query plans analyzed',
        count: results.length,
        compareWithPrevious,
        results
      });
    } catch (error: any) {
      console.error('Error analyzing query plans:', error?.message || error);
      res.status(500).json({ 
        message: 'Error analyzing query plans', 
        error: error?.message || String(error)
      });
    }
  }

  /**
   * Run a quick health check on both PostgreSQL and MongoDB databases
   */
  public async runHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = await databaseOptimizationService.runHealthCheck();
      
      // Set appropriate status code based on database statuses
      const hasError = 
        healthCheck.postgres.status === 'error' || 
        healthCheck.mongodb.status === 'error';
      
      res.status(hasError ? 500 : 200).json({
        message: hasError ? 'Database health check detected issues' : 'Database health check completed',
        timestamp: healthCheck.timestamp,
        postgres: healthCheck.postgres,
        mongodb: healthCheck.mongodb
      });
    } catch (error: any) {
      console.error('Error running database health check:', error?.message || error);
      res.status(500).json({ 
        message: 'Error running database health check', 
        error: error?.message || String(error)
      });
    }
  }
}

// Export singleton instance
export const databaseOptimizationController = new DatabaseOptimizationController(); 