// Simple scheduler service for processing scheduled reports and exports
// In production, replace with a proper job queue like Bull or Agenda

import reportingService from './reportingService';
import analyticsService from './analyticsService';
import notificationService from './notificationService';
import { ScheduledReport } from '../models/ScheduledReport';

class SchedulerService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number = 60 * 1000; // Check every minute

  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 60 * 1000;
  }

  // Start the scheduler
  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting report scheduler...');
    this.isRunning = true;

    // Check for due reports immediately
    this.processScheduledReports();

    // Set up periodic checking
    this.intervalId = setInterval(() => {
      this.processScheduledReports();
    }, this.checkInterval);
  }

  // Stop the scheduler
  stop(): void {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping report scheduler...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Process scheduled reports and exports
  async processScheduledReports(): Promise<void> {
    try {
      if (!this.isRunning) return;

      // Process traditional scheduled reports
      const reportResult = await reportingService.processScheduledReports();
      if (reportResult.processed > 0) {
        console.log(`Processed ${reportResult.processed} scheduled reports`);
      }

      // Process scheduled exports
      await this.processScheduledExports();

    } catch (error) {
      console.error('Scheduler error:', error);
    }
  }

  // Process scheduled exports
  async processScheduledExports(): Promise<void> {
    try {
      const now = new Date();

      // Find scheduled exports due for execution
      const dueExports = await ScheduledReport.findMany({
        where: {
          nextRun: { lte: now },
          isActive: true
        }
      });

      for (const scheduledExport of dueExports) {
        await this.executeScheduledExport(scheduledExport);
      }
    } catch (error) {
      console.error('Error processing scheduled exports:', error);
    }
  }

  // Execute a scheduled export
  async executeScheduledExport(scheduledExport: any): Promise<void> {
    try {
      console.log(`Executing scheduled export: ${scheduledExport.id}`);

      const filters = JSON.parse(scheduledExport.filters || '{}');

      // Get user role and properties for role-based access control
      const userRole = 'OWNER'; // Default for scheduled exports
      const userProperties: string[] = []; // Empty for owners, all properties accessible

      // Generate the export using analytics service
      const exportResult = await analyticsService.generateExport(
        scheduledExport.format,
        scheduledExport.template,
        filters,
        scheduledExport.userId,
        userRole,
        userProperties
      );

      if (exportResult.success) {
        // Send email notification
        const emailResult = await notificationService.sendScheduledExportEmail(
          {
            id: exportResult.exportId,
            templateName: scheduledExport.templateName,
            format: scheduledExport.format,
            generatedAt: new Date(),
            frequency: scheduledExport.frequency,
            nextExport: this.calculateNextRun(scheduledExport.frequency),
            downloadUrl: exportResult.downloadUrl
          },
          scheduledExport.email,
          { includeAttachment: exportResult.attachmentData ? true : false, attachmentData: exportResult.attachmentData }
        );

        if (emailResult.success) {
          console.log(`Scheduled export completed and emailed: ${scheduledExport.id}`);
        } else {
          console.error(`Scheduled export generated but email failed: ${scheduledExport.id}`, emailResult.error);
        }
      } else {
        console.error(`Scheduled export generation failed: ${scheduledExport.id}`, exportResult.error);

        // Send failure notification
        await notificationService.sendFailureNotification(
          scheduledExport.templateName,
          scheduledExport.nextRun,
          (exportResult.error as string) || 'Export generation failed',
          [scheduledExport.email]
        );
      }

      // Update next run time
      const nextRun = this.calculateNextRun(scheduledExport.frequency);
      await ScheduledReport.update({
        where: { id: scheduledExport.id },
        data: { nextRun, lastRun: new Date() }
      });

    } catch (error) {
      console.error(`Error executing scheduled export ${scheduledExport.id}:`, error);

      // Send failure notification
      await notificationService.sendFailureNotification(
        scheduledExport.templateName,
        scheduledExport.nextRun,
        error.message,
        [scheduledExport.email]
      );
    }
  }

  // Calculate next run time based on frequency
  calculateNextRun(frequency: string): Date {
    const now = new Date();

    switch (frequency.toLowerCase()) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      case 'monthly': {
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      }
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to weekly
    }
  }

  // Get scheduler status
  getStatus(): { isRunning: boolean; checkInterval: number; nextCheckIn: number | null } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      nextCheckIn: this.intervalId ? Math.ceil(this.checkInterval / 1000) : null
    };
  }

  // Schedule a new export
  async scheduleExport(exportConfig: any): Promise<any> {
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
        data: {
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
        }
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
        error: (error as Error).message
      };
    }
  }

  // Cancel a scheduled export
  async cancelScheduledExport(scheduleId: string, userId: string): Promise<any> {
    try {
      const result = await ScheduledReport.update({
        where: {
          id: scheduleId,
          userId,
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      if (result.count > 0) {
        console.log(`Scheduled export cancelled: ${scheduleId}`);
        return { success: true };
      } else {
        return { success: false, error: 'Scheduled export not found or already cancelled' };
      }
    } catch (error) {
      console.error('Error cancelling scheduled export:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Get user's scheduled exports
  async getUserScheduledExports(userId: string): Promise<any[]> {
    try {
      const reports = await ScheduledReport.findMany({
        where: {
          userId,
          isActive: true
        },
        orderBy: {
          nextRun: 'asc'
        }
      });

      return reports.map((report: any) => ({
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

  // Manual trigger for testing
  async triggerNow(): Promise<any> {
    console.log('Manually triggering scheduled report processing...');
    return await this.processScheduledReports();
  }
}

export default new SchedulerService();