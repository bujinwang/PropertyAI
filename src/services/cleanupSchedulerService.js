// Scheduled cleanup service for data retention and compliance
const auditService = require('./auditService');

class CleanupSchedulerService {
  constructor() {
    this.isRunning = false;
    this.cleanupIntervalId = null;
    this.statsIntervalId = null;

    // Run cleanup daily at 2 AM
    this.cleanupSchedule = {
      hour: 2,
      minute: 0
    };

    // Generate stats weekly on Sunday at 3 AM
    this.statsSchedule = {
      dayOfWeek: 0, // Sunday
      hour: 3,
      minute: 0
    };
  }

  // Start the cleanup scheduler
  start() {
    if (this.isRunning) {
      console.log('Cleanup scheduler is already running');
      return;
    }

    console.log('Starting cleanup scheduler...');
    this.isRunning = true;

    // Schedule daily cleanup
    this.scheduleDailyCleanup();

    // Schedule weekly stats generation
    this.scheduleWeeklyStats();

    console.log('Cleanup scheduler started successfully');
  }

  // Stop the cleanup scheduler
  stop() {
    if (!this.isRunning) {
      console.log('Cleanup scheduler is not running');
      return;
    }

    console.log('Stopping cleanup scheduler...');
    this.isRunning = false;

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
    }
  }

  // Schedule daily cleanup
  scheduleDailyCleanup() {
    const now = new Date();
    const cleanupTime = new Date(now);
    cleanupTime.setHours(this.cleanupSchedule.hour, this.cleanupSchedule.minute, 0, 0);

    // If cleanup time has passed today, schedule for tomorrow
    if (cleanupTime <= now) {
      cleanupTime.setDate(cleanupTime.getDate() + 1);
    }

    const timeUntilCleanup = cleanupTime.getTime() - now.getTime();

    // Schedule first cleanup
    setTimeout(() => {
      this.runDailyCleanup();

      // Then schedule daily interval (24 hours)
      this.cleanupIntervalId = setInterval(() => {
        this.runDailyCleanup();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilCleanup);

    console.log(`Daily cleanup scheduled for ${cleanupTime.toISOString()}`);
  }

  // Schedule weekly stats
  scheduleWeeklyStats() {
    const now = new Date();
    const statsTime = new Date(now);

    // Find next Sunday
    const daysUntilSunday = (7 - now.getDay()) % 7;
    if (daysUntilSunday === 0 && now.getHours() >= this.statsSchedule.hour) {
      // If it's Sunday and past the scheduled time, schedule for next Sunday
      statsTime.setDate(statsTime.getDate() + 7);
    } else {
      statsTime.setDate(statsTime.getDate() + daysUntilSunday);
    }

    statsTime.setHours(this.statsSchedule.hour, this.statsSchedule.minute, 0, 0);

    const timeUntilStats = statsTime.getTime() - now.getTime();

    // Schedule first stats generation
    setTimeout(() => {
      this.generateWeeklyStats();

      // Then schedule weekly interval (7 days)
      this.statsIntervalId = setInterval(() => {
        this.generateWeeklyStats();
      }, 7 * 24 * 60 * 60 * 1000);
    }, timeUntilStats);

    console.log(`Weekly stats scheduled for ${statsTime.toISOString()}`);
  }

  // Run daily cleanup
  async runDailyCleanup() {
    try {
      console.log('Running daily data retention cleanup...');

      const cleanupResults = await auditService.runFullDataRetentionCleanup();

      console.log('Daily cleanup completed:', cleanupResults);

      // Log cleanup operation
      await auditService.logEvent({
        userId: null, // System operation
        action: 'compliance_check',
        resourceType: 'system',
        resourceId: 'daily-cleanup',
        details: {
          cleanupType: 'daily',
          results: cleanupResults
        },
        riskLevel: 'low'
      });

    } catch (error) {
      console.error('Daily cleanup failed:', error);

      // Log cleanup failure
      await auditService.logEvent({
        userId: null,
        action: 'compliance_check',
        resourceType: 'system',
        resourceId: 'daily-cleanup-failure',
        details: {
          error: error.message,
          stack: error.stack
        },
        riskLevel: 'medium'
      });
    }
  }

  // Generate weekly statistics
  async generateWeeklyStats() {
    try {
      console.log('Generating weekly data retention statistics...');

      const stats = await auditService.getDataRetentionStatistics();

      console.log('Weekly stats generated:', stats);

      // Log stats generation
      await auditService.logEvent({
        userId: null,
        action: 'compliance_check',
        resourceType: 'system',
        resourceId: 'weekly-stats',
        details: {
          statsType: 'weekly',
          statistics: stats
        },
        riskLevel: 'low'
      });

      // In production, you might want to:
      // - Send email notifications for concerning stats
      // - Generate compliance reports
      // - Alert administrators of retention policy violations

    } catch (error) {
      console.error('Weekly stats generation failed:', error);

      await auditService.logEvent({
        userId: null,
        action: 'compliance_check',
        resourceType: 'system',
        resourceId: 'weekly-stats-failure',
        details: {
          error: error.message,
          stack: error.stack
        },
        riskLevel: 'medium'
      });
    }
  }

  // Manual trigger for testing
  async triggerCleanupNow() {
    console.log('Manually triggering cleanup...');
    return await this.runDailyCleanup();
  }

  async triggerStatsNow() {
    console.log('Manually triggering stats generation...');
    return await this.generateWeeklyStats();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      cleanupSchedule: this.cleanupSchedule,
      statsSchedule: this.statsSchedule,
      nextCleanup: this.getNextCleanupTime(),
      nextStats: this.getNextStatsTime()
    };
  }

  // Calculate next cleanup time
  getNextCleanupTime() {
    const now = new Date();
    const nextCleanup = new Date(now);
    nextCleanup.setHours(this.cleanupSchedule.hour, this.cleanupSchedule.minute, 0, 0);

    if (nextCleanup <= now) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }

    return nextCleanup;
  }

  // Calculate next stats time
  getNextStatsTime() {
    const now = new Date();
    const nextStats = new Date(now);

    const daysUntilSunday = (7 - now.getDay()) % 7;
    if (daysUntilSunday === 0 && now.getHours() >= this.statsSchedule.hour) {
      nextStats.setDate(nextStats.getDate() + 7);
    } else {
      nextStats.setDate(nextStats.getDate() + daysUntilSunday);
    }

    nextStats.setHours(this.statsSchedule.hour, this.statsSchedule.minute, 0, 0);

    return nextStats;
  }
}

module.exports = new CleanupSchedulerService();