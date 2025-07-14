// dbOptimizationWorker.ts
// Standalone worker for scheduled database optimization tasks
// Usage: npx ts-node src/workers/dbOptimizationWorker.ts OR node dist/workers/dbOptimizationWorker.js
// Ensure environment variables are loaded (dotenv)

import 'dotenv/config';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { databaseOptimizationService } from '../services/databaseOptimization.service';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Log file path
const logsDir = path.join(__dirname, '../../logs/database');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const workerLogPath = path.join(logsDir, 'worker-log.txt');

function logToFile(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(workerLogPath, line);
}

// Helper: Send alert email if SMTP config is present
async function sendAlertEmail(subject: string, text: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO, ALERT_EMAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !ALERT_EMAIL_TO || !ALERT_EMAIL_FROM) {
    logger.warn('SMTP not configured, cannot send alert email.');
    logToFile('SMTP not configured, cannot send alert email.');
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: ALERT_EMAIL_FROM,
      to: ALERT_EMAIL_TO,
      subject,
      text,
    });
    logger.info('Alert email sent.');
    logToFile('Alert email sent.');
  } catch (err: any) {
    logger.error('Failed to send alert email: ' + (err?.message || err));
    logToFile('Failed to send alert email: ' + (err?.message || err));
  }
}

/**
 * Log optimization results to the database for historical trend analysis
 */
async function logToDatabase(
  slowQueries: { postgres: any[], mongodb: any[] },
  indexSuggestions: string[],
  metrics: any,
  alerts: string[] = []
) {
  try {
    // Use $executeRaw since the table might not be in the Prisma schema yet
    await prisma.$executeRaw`
      INSERT INTO db_optimization_logs (
        slow_queries_json, 
        index_suggestions_json, 
        metrics_json, 
        alerts_json, 
        log_type, 
        notes
      ) VALUES (
        ${JSON.stringify(slowQueries)}::jsonb,
        ${JSON.stringify(indexSuggestions)}::jsonb,
        ${JSON.stringify(metrics)}::jsonb,
        ${JSON.stringify(alerts)}::jsonb,
        'scheduled',
        'Automated run from dbOptimizationWorker'
      )
    `;
    logger.info('Optimization results logged to database');
    logToFile('Optimization results logged to database');
  } catch (err: any) {
    logger.error('Failed to log optimization results to database: ' + (err?.message || err));
    logToFile('Failed to log optimization results to database: ' + (err?.message || err));
  }
}

async function runAllOptimizations() {
  try {
    logger.info('DB Optimization Worker: Starting scheduled tasks...');
    logToFile('--- DB Optimization Run Start ---');

    // Collect alerts for the database log
    const alerts: string[] = [];
    
    // 1. Analyze slow queries (Postgres & Mongo)
    const pgSlow = await databaseOptimizationService.analyzePostgresSlowQueries();
    const mongoSlow = await databaseOptimizationService.analyzeMongoSlowQueries();
    logToFile(`Postgres slow queries: ${JSON.stringify(pgSlow, null, 2)}`);
    logToFile(`Mongo slow queries: ${JSON.stringify(mongoSlow, null, 2)}`);
    if (pgSlow.length > 0 || mongoSlow.length > 0) {
      // Placeholder: send alert (console/email/Slack)
      logger.warn('ALERT: Slow queries detected!');
      logToFile('ALERT: Slow queries detected!');
      alerts.push('Slow queries detected');
      await sendAlertEmail(
        'PropertyAI DB Alert: Slow Queries Detected',
        `Slow queries detected:\n\nPostgres: ${JSON.stringify(pgSlow, null, 2)}\n\nMongo: ${JSON.stringify(mongoSlow, null, 2)}`
      );
    }

    // 2. Index suggestion (dry-run)
    const indexSuggestions = await databaseOptimizationService.createMissingIndexes(false);
    logToFile(`Index suggestions: ${JSON.stringify(indexSuggestions, null, 2)}`);
    if (indexSuggestions.length > 0) {
      alerts.push(`${indexSuggestions.length} index suggestions found`);
    }

    // 3. VACUUM ANALYZE (Postgres)
    await databaseOptimizationService.runVacuumAnalyze();
    logToFile('VACUUM ANALYZE completed.');

    // 4. Metrics logging
    const metrics = await databaseOptimizationService.getDatabaseMetrics();
    logToFile(`DB Metrics: ${JSON.stringify(metrics, null, 2)}`);
    
    // 5. Log to database for historical trend analysis
    await logToDatabase(
      { postgres: pgSlow, mongodb: mongoSlow },
      indexSuggestions,
      metrics,
      alerts
    );

    logToFile('--- DB Optimization Run End ---');
    logger.info('DB Optimization Worker: All scheduled tasks completed.');
  } catch (err: any) {
    logger.error('DB Optimization Worker error: ' + (err?.message || err));
    logToFile('ERROR: ' + (err?.message || err));
  }
}

// Schedule: every day at 2am
cron.schedule('0 2 * * *', () => {
  runAllOptimizations();
});

// Also run immediately on startup
runAllOptimizations();

// Keep process alive
setInterval(() => {}, 1 << 30);

// To enable email alerts, set the following environment variables:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO, ALERT_EMAIL_FROM
// If not set, alerts will only be logged to console and file. 