// Simple scheduler service for processing scheduled reports
// In production, replace with a proper job queue like Bull or Agenda

import reportingService from './reportingService';

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

  // Process scheduled reports
  async processScheduledReports(): Promise<void> {
    try {
      if (!this.isRunning) return;

      const result = await reportingService.processScheduledReports();
      if (result.processed > 0) {
        console.log(`Processed ${result.processed} scheduled reports`);
      }
    } catch (error) {
      console.error('Scheduler error:', error);
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

  // Manual trigger for testing
  async triggerNow(): Promise<any> {
    console.log('Manually triggering scheduled report processing...');
    return await this.processScheduledReports();
  }
}

export default new SchedulerService();