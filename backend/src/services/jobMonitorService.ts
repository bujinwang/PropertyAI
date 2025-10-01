import { Queue, Job } from 'bullmq';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';

interface JobStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

interface JobMetrics {
  queueName: string;
  stats: JobStats;
  processingRate: number;
  avgProcessingTime: number;
  failureRate: number;
  lastUpdated: string;
}

interface FailedJob {
  id: string;
  name: string;
  data: any;
  failedReason: string;
  attemptsMade: number;
  timestamp: string;
}

export class JobMonitorService {
  private queues: Map<string, Queue> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Register a queue for monitoring
   */
  registerQueue(queueName: string, queue: Queue): void {
    this.queues.set(queueName, queue);
    logger.info(`Queue registered for monitoring: ${queueName}`);
  }

  /**
   * Start monitoring all registered queues
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      logger.warn('Job monitoring already started');
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);

    logger.info(`Job monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Job monitoring stopped');
    }
  }

  /**
   * Get metrics for a specific queue
   */
  async getQueueMetrics(queueName: string): Promise<JobMetrics | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      logger.warn(`Queue not found: ${queueName}`);
      return null;
    }

    try {
      const stats = await this.getQueueStats(queue);
      const processingRate = await this.calculateProcessingRate(queueName);
      const avgProcessingTime = await this.calculateAvgProcessingTime(queueName);
      const failureRate = await this.calculateFailureRate(queueName);

      return {
        queueName,
        stats,
        processingRate,
        avgProcessingTime,
        failureRate,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error getting metrics for queue ${queueName}:`, error);
      return null;
    }
  }

  /**
   * Get metrics for all queues
   */
  async getAllMetrics(): Promise<JobMetrics[]> {
    const metrics: JobMetrics[] = [];

    for (const [queueName, queue] of this.queues) {
      const queueMetrics = await this.getQueueMetrics(queueName);
      if (queueMetrics) {
        metrics.push(queueMetrics);
      }
    }

    return metrics;
  }

  /**
   * Get failed jobs for a queue
   */
  async getFailedJobs(
    queueName: string,
    limit: number = 10
  ): Promise<FailedJob[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return [];
    }

    try {
      const failedJobs = await queue.getFailed(0, limit - 1);

      return failedJobs.map((job: Job) => ({
        id: job.id || 'unknown',
        name: job.name,
        data: job.data,
        failedReason: job.failedReason || 'Unknown error',
        attemptsMade: job.attemptsMade,
        timestamp: new Date(job.processedOn || Date.now()).toISOString(),
      }));
    } catch (error) {
      logger.error(`Error getting failed jobs for ${queueName}:`, error);
      return [];
    }
  }

  /**
   * Retry a failed job
   */
  async retryFailedJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        logger.warn(`Job not found: ${jobId}`);
        return false;
      }

      await job.retry();
      logger.info(`Job retried: ${queueName}/${jobId}`);
      return true;
    } catch (error) {
      logger.error(`Error retrying job ${queueName}/${jobId}:`, error);
      return false;
    }
  }

  /**
   * Remove a failed job
   */
  async removeFailedJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return false;
      }

      await job.remove();
      logger.info(`Job removed: ${queueName}/${jobId}`);
      return true;
    } catch (error) {
      logger.error(`Error removing job ${queueName}/${jobId}:`, error);
      return false;
    }
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(
    queueName: string,
    grace: number = 86400000, // 24 hours
    status?: 'completed' | 'failed'
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return 0;
    }

    try {
      let count = 0;

      if (!status || status === 'completed') {
        const completedCount = await queue.clean(grace, 1000, 'completed');
        count += completedCount.length;
      }

      if (!status || status === 'failed') {
        const failedCount = await queue.clean(grace, 1000, 'failed');
        count += failedCount.length;
      }

      logger.info(`Cleaned ${count} jobs from ${queueName}`);
      return count;
    } catch (error) {
      logger.error(`Error cleaning queue ${queueName}:`, error);
      return 0;
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    try {
      await queue.pause();
      logger.info(`Queue paused: ${queueName}`);
      return true;
    } catch (error) {
      logger.error(`Error pausing queue ${queueName}:`, error);
      return false;
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    try {
      await queue.resume();
      logger.info(`Queue resumed: ${queueName}`);
      return true;
    } catch (error) {
      logger.error(`Error resuming queue ${queueName}:`, error);
      return false;
    }
  }

  /**
   * Get detailed stats for a queue
   */
  private async getQueueStats(queue: Queue): Promise<JobStats> {
    const [waiting, active, completed, failed, delayed, paused] =
      await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.getPausedCount(),
      ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  /**
   * Calculate processing rate (jobs/minute)
   */
  private async calculateProcessingRate(queueName: string): Promise<number> {
    const cacheKey = `job_metrics:${queueName}:completed_count`;
    
    // Get current completed count
    const queue = this.queues.get(queueName);
    if (!queue) return 0;

    const currentCount = await queue.getCompletedCount();

    // Get previous count from cache
    const previousData = await cacheService.get<{
      count: number;
      timestamp: number;
    }>(cacheKey);

    // Calculate rate
    let rate = 0;
    if (previousData) {
      const timeDiffMinutes = (Date.now() - previousData.timestamp) / 60000;
      const countDiff = currentCount - previousData.count;
      rate = timeDiffMinutes > 0 ? countDiff / timeDiffMinutes : 0;
    }

    // Store current count
    await cacheService.set(
      cacheKey,
      {
        count: currentCount,
        timestamp: Date.now(),
      },
      3600
    );

    return Math.round(rate * 100) / 100;
  }

  /**
   * Calculate average processing time (ms)
   */
  private async calculateAvgProcessingTime(
    queueName: string
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) return 0;

    try {
      const completedJobs = await queue.getCompleted(0, 99);
      
      if (completedJobs.length === 0) return 0;

      const totalTime = completedJobs.reduce((sum, job: Job) => {
        const processedTime = job.processedOn || 0;
        const finishedTime = job.finishedOn || 0;
        return sum + (finishedTime - processedTime);
      }, 0);

      return Math.round(totalTime / completedJobs.length);
    } catch (error) {
      logger.error(`Error calculating avg processing time:`, error);
      return 0;
    }
  }

  /**
   * Calculate failure rate (percentage)
   */
  private async calculateFailureRate(queueName: string): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) return 0;

    try {
      const [completed, failed] = await Promise.all([
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);

      const total = completed + failed;
      if (total === 0) return 0;

      return Math.round((failed / total) * 10000) / 100;
    } catch (error) {
      logger.error(`Error calculating failure rate:`, error);
      return 0;
    }
  }

  /**
   * Collect and cache metrics for all queues
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.getAllMetrics();

      // Cache metrics
      await cacheService.set('job_metrics:all', metrics, 300);

      // Log summary
      const summary = metrics.map((m) => ({
        queue: m.queueName,
        active: m.stats.active,
        waiting: m.stats.waiting,
        failed: m.stats.failed,
        rate: m.processingRate,
      }));

      logger.debug('Job metrics collected:', summary);

      // Alert on high failure rates
      metrics.forEach((m) => {
        if (m.failureRate > 10) {
          logger.warn(
            `High failure rate for queue ${m.queueName}: ${m.failureRate}%`
          );
        }
      });
    } catch (error) {
      logger.error('Error collecting job metrics:', error);
    }
  }
}

// Export singleton instance
export const jobMonitorService = new JobMonitorService();
