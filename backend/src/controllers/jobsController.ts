import { Request, Response } from 'express';
import { jobMonitorService } from '../services/jobMonitorService';
import { logger } from '../utils/logger';

export class JobsController {
  /**
   * Get metrics for all queues
   */
  async getAllMetrics(req: Request, res: Response) {
    try {
      const metrics = await jobMonitorService.getAllMetrics();

      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error getting job metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get job metrics',
      });
    }
  }

  /**
   * Get metrics for a specific queue
   */
  async getQueueMetrics(req: Request, res: Response) {
    const { queueName } = req.params;

    try {
      const metrics = await jobMonitorService.getQueueMetrics(queueName);

      if (!metrics) {
        return res.status(404).json({
          success: false,
          message: 'Queue not found',
        });
      }

      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error(`Error getting metrics for queue ${queueName}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get queue metrics',
      });
    }
  }

  /**
   * Get failed jobs for a queue
   */
  async getFailedJobs(req: Request, res: Response) {
    const { queueName } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const failedJobs = await jobMonitorService.getFailedJobs(queueName, limit);

      return res.json({
        success: true,
        data: failedJobs,
        count: failedJobs.length,
      });
    } catch (error) {
      logger.error(`Error getting failed jobs for queue ${queueName}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get failed jobs',
      });
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(req: Request, res: Response) {
    const { queueName, jobId } = req.params;

    try {
      const success = await jobMonitorService.retryFailedJob(queueName, jobId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Job not found or retry failed',
        });
      }

      return res.json({
        success: true,
        message: 'Job retried successfully',
      });
    } catch (error) {
      logger.error(`Error retrying job ${queueName}/${jobId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retry job',
      });
    }
  }

  /**
   * Remove a failed job
   */
  async removeJob(req: Request, res: Response) {
    const { queueName, jobId } = req.params;

    try {
      const success = await jobMonitorService.removeFailedJob(queueName, jobId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Job not found or removal failed',
        });
      }

      return res.json({
        success: true,
        message: 'Job removed successfully',
      });
    } catch (error) {
      logger.error(`Error removing job ${queueName}/${jobId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove job',
      });
    }
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(req: Request, res: Response) {
    const { queueName } = req.params;
    const grace = parseInt(req.query.grace as string) || 86400000; // 24 hours default
    const status = req.query.status as 'completed' | 'failed' | undefined;

    try {
      const count = await jobMonitorService.cleanQueue(queueName, grace, status);

      return res.json({
        success: true,
        message: `Cleaned ${count} jobs from queue`,
        count,
      });
    } catch (error) {
      logger.error(`Error cleaning queue ${queueName}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to clean queue',
      });
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(req: Request, res: Response) {
    const { queueName } = req.params;

    try {
      const success = await jobMonitorService.pauseQueue(queueName);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Queue not found or pause failed',
        });
      }

      return res.json({
        success: true,
        message: 'Queue paused successfully',
      });
    } catch (error) {
      logger.error(`Error pausing queue ${queueName}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to pause queue',
      });
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(req: Request, res: Response) {
    const { queueName } = req.params;

    try {
      const success = await jobMonitorService.resumeQueue(queueName);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Queue not found or resume failed',
        });
      }

      return res.json({
        success: true,
        message: 'Queue resumed successfully',
      });
    } catch (error) {
      logger.error(`Error resuming queue ${queueName}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to resume queue',
      });
    }
  }
}

export const jobsController = new JobsController();
