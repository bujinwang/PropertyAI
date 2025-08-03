#!/usr/bin/env ts-node

import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';

class CleanupScheduler {
  private readonly GRACE_PERIOD_END = new Date('2025-02-01');

  constructor() {
    this.scheduleCleanup();
  }

  private scheduleCleanup(): void {
    // Check daily if grace period has ended
    cron.schedule('0 0 * * *', () => {
      this.checkGracePeriod();
    });

    console.log('📅 Cleanup scheduler started');
    console.log(`Grace period ends: ${this.GRACE_PERIOD_END.toDateString()}`);
  }

  private checkGracePeriod(): void {
    const now = new Date();
    
    if (now >= this.GRACE_PERIOD_END) {
      console.log('⏰ Grace period ended - executing final cleanup');
      this.executeFinalCleanup();
    } else {
      const daysRemaining = Math.ceil((this.GRACE_PERIOD_END.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`📅 ${daysRemaining} days remaining in grace period`);
    }
  }

  private async executeFinalCleanup(): Promise<void> {
    try {
      console.log('🧹 Executing final cleanup...');
      
      // Remove deprecation stubs
      await this.removeDeprecationStubs();
      
      // Remove legacy route registrations completely
      await this.removeLegacyRoutes();
      
      // Clean up monitoring logs
      await this.archiveMonitoringLogs();
      
      console.log('✅ Final cleanup completed');
      
    } catch (error) {
      console.error('❌ Final cleanup failed:', error);
    }
  }

  private async removeDeprecationStubs(): Promise<void> {
    const stubFiles = [
      'src/controllers/propertyController.ts',
      'src/controllers/unitController.ts',
      'src/controllers/listingController.ts'
    ];

    for (const file of stubFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed ${file}`);
      }
    }
  }

  private async removeLegacyRoutes(): Promise<void> {
    const routesFile = path.join(__dirname, '..', 'src', 'routes', 'index.ts');
    
    if (fs.existsSync(routesFile)) {
      let content = fs.readFileSync(routesFile, 'utf8');
      
      // Remove commented legacy routes
      content = content.replace(/\/\/ app\.use\(.*deprecated.*\n/gi, '');
      
      fs.writeFileSync(routesFile, content);
      console.log('🛣️  Removed legacy route comments');
    }
  }

  private async archiveMonitoringLogs(): Promise<void> {
    const logFile = path.join(__dirname, '..', 'logs', 'deprecated-endpoints.log');
    
    if (fs.existsSync(logFile)) {
      const archiveFile = path.join(
        path.dirname(logFile), 
        `deprecated-endpoints-archive-${new Date().toISOString().split('T')[0]}.log`
      );
      
      fs.renameSync(logFile, archiveFile);
      console.log('📦 Archived monitoring logs');
    }
  }
}

// Start the scheduler
new CleanupScheduler();