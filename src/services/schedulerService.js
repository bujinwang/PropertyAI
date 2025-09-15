/**
 * Scheduler Service
 * Handles scheduled tasks like recurring exports
 */

const { ScheduledReport } = require('../models');
const notificationService = require('./notificationService');
const analyticsService = require('./analyticsService');
const exportService = require('../utils/exportService');

class SchedulerService {
  constructor() {
    this.scheduledTasks = new Map();
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Scheduler service started');

    // Check for scheduled tasks every minute
    this.interval = setInterval(() => {
      this.checkScheduledTasks();
    }, 60000); // 1 minute

    // Initial check
    this.checkScheduledTasks();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Scheduler service stopped');
  }

  /**
   * Schedule a new export
   */
  async scheduleExport(exportConfig) {
    try {
      const {
        userId,
        email,
        format,
        template,
        frequency,
        filters = {},
        templateName = 'Scheduled Export'
      } = exportConfig;

      // Calculate next run time
      const nextRun = this.calculateNextRun(frequency);

      // Create scheduled report record
      const scheduledReport = await ScheduledReport.create({
        userId,
        email,
        format,
        template,
        frequency,
        filters: JSON.stringify(filters),
        templateName,
        nextRun,
        isActive: true,
        createdAt: new Date()
      });

      console.log(`Scheduled export created: ${scheduledReport.id} - Next run: ${nextRun}`);

      return {
        success: true,
        scheduleId: scheduledReport.id,
        nextRun
      };
    } catch (error) {
      console.error('Error scheduling export:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel a scheduled export
   */
  async cancelScheduledExport(scheduleId, userId) {
    try {
      const result = await ScheduledReport.update(
        { isActive: false },
        {
          where: {
            id: scheduleId,
            userId,
            isActive: true
          }
        }
      );

      if (result[0] > 0) {
        console.log(`Scheduled export cancelled: ${scheduleId}`);
        return { success: true };
      } else {
        return { success: false, error: 'Scheduled export not found or already cancelled' };
      }
    } catch (error) {
      console.error('Error cancelling scheduled export:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for and execute scheduled tasks
   */
  async checkScheduledTasks() {
    try {
      const now = new Date();

      // Find scheduled reports due for execution
      const dueReports = await ScheduledReport.findAll({
        where: {
          nextRun: { [require('sequelize').Op.lte]: now },
          isActive: true
        }
      });

      for (const report of dueReports) {
        await this.executeScheduledExport(report);
      }
    } catch (error) {
      console.error('Error checking scheduled tasks:', error);
    }
  }

  /**
   * Execute a scheduled export
   */
  async executeScheduledExport(scheduledReport) {
    try {
      console.log(`Executing scheduled export: ${scheduledReport.id}`);

      const filters = JSON.parse(scheduledReport.filters || '{}');

      // Get user role and properties for role-based access control
      // In a real implementation, this would come from the user service
      const userRole = 'OWNER'; // Default for scheduled exports
      const userProperties = []; // Empty for owners, all properties accessible

      // Generate the export using analytics service
      const exportResult = await analyticsService.generateExport(
        scheduledReport.format,
        scheduledReport.template,
        filters,
        scheduledReport.userId,
        userRole,
        userProperties
      );

      if (exportResult.success) {
        // Send email notification
        const emailResult = await notificationService.sendScheduledExportEmail(
          {
            id: exportResult.exportId,
            templateName: scheduledReport.templateName,
            format: scheduledReport.format,
            generatedAt: new Date(),
            frequency: scheduledReport.frequency,
            nextExport: this.calculateNextRun(scheduledReport.frequency),
            downloadUrl: exportResult.downloadUrl
          },
          scheduledReport.email,
          { includeAttachment: exportResult.attachmentData ? true : false, attachmentData: exportResult.attachmentData }
        );

        if (emailResult.success) {
          console.log(`Scheduled export completed and emailed: ${scheduledReport.id}`);
        } else {
          console.error(`Scheduled export generated but email failed: ${scheduledReport.id}`, emailResult.error);
        }
      } else {
        console.error(`Scheduled export generation failed: ${scheduledReport.id}`, exportResult.error);

        // Send failure notification
        await notificationService.sendFailureNotification(
          scheduledReport.templateName,
          scheduledReport.nextRun,
          exportResult.error || 'Export generation failed',
          [scheduledReport.email]
        );
      }

      // Update next run time
      const nextRun = this.calculateNextRun(scheduledReport.frequency);
      await scheduledReport.update({ nextRun, lastRun: new Date() });

    } catch (error) {
      console.error(`Error executing scheduled export ${scheduledReport.id}:`, error);

      // Send failure notification
      await notificationService.sendFailureNotification(
        scheduledReport.templateName,
        scheduledReport.nextRun,
        error.message,
        [scheduledReport.email]
      );
    }
  }

  /**
   * Calculate next run time based on frequency
   */
  calculateNextRun(frequency) {
    const now = new Date();

    switch (frequency.toLowerCase()) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to weekly
    }
  }

  /**
   * Get user's scheduled exports
   */
  async getUserScheduledExports(userId) {
    try {
      const reports = await ScheduledReport.findAll({
        where: {
          userId,
          isActive: true
        },
        order: [['nextRun', 'ASC']]
      });

      return reports.map(report => ({
        id: report.id,
        templateName: report.templateName,
        format: report.format,
        frequency: report.frequency,
        nextRun: report.nextRun,
        lastRun: report.lastRun
      }));
    } catch (error) {
      console.error('Error getting user scheduled exports:', error);
      return [];
    }
  }
}

module.exports = new SchedulerService();