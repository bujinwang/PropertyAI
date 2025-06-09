"use strict";
// dbOptimizationWorker.ts
// Standalone worker for scheduled database optimization tasks
// Usage: npx ts-node src/workers/dbOptimizationWorker.ts OR node dist/workers/dbOptimizationWorker.js
// Ensure environment variables are loaded (dotenv)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_cron_1 = __importDefault(require("node-cron"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
const databaseOptimization_service_1 = require("../services/databaseOptimization.service");
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_1 = require("@prisma/client");
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Log file path
const logsDir = path_1.default.join(__dirname, '../../logs/database');
if (!fs_1.default.existsSync(logsDir))
    fs_1.default.mkdirSync(logsDir, { recursive: true });
const workerLogPath = path_1.default.join(logsDir, 'worker-log.txt');
function logToFile(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs_1.default.appendFileSync(workerLogPath, line);
}
// Helper: Send alert email if SMTP config is present
async function sendAlertEmail(subject, text) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO, ALERT_EMAIL_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !ALERT_EMAIL_TO || !ALERT_EMAIL_FROM) {
        logger_1.default.warn('SMTP not configured, cannot send alert email.');
        logToFile('SMTP not configured, cannot send alert email.');
        return;
    }
    try {
        const transporter = nodemailer_1.default.createTransport({
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
        logger_1.default.info('Alert email sent.');
        logToFile('Alert email sent.');
    }
    catch (err) {
        logger_1.default.error('Failed to send alert email: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
        logToFile('Failed to send alert email: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
    }
}
/**
 * Log optimization results to the database for historical trend analysis
 */
async function logToDatabase(slowQueries, indexSuggestions, metrics, alerts = []) {
    try {
        // Use $executeRaw since the table might not be in the Prisma schema yet
        await prisma.$executeRaw `
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
        logger_1.default.info('Optimization results logged to database');
        logToFile('Optimization results logged to database');
    }
    catch (err) {
        logger_1.default.error('Failed to log optimization results to database: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
        logToFile('Failed to log optimization results to database: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
    }
}
async function runAllOptimizations() {
    try {
        logger_1.default.info('DB Optimization Worker: Starting scheduled tasks...');
        logToFile('--- DB Optimization Run Start ---');
        // Collect alerts for the database log
        const alerts = [];
        // 1. Analyze slow queries (Postgres & Mongo)
        const pgSlow = await databaseOptimization_service_1.databaseOptimizationService.analyzePostgresSlowQueries();
        const mongoSlow = await databaseOptimization_service_1.databaseOptimizationService.analyzeMongoSlowQueries();
        logToFile(`Postgres slow queries: ${JSON.stringify(pgSlow, null, 2)}`);
        logToFile(`Mongo slow queries: ${JSON.stringify(mongoSlow, null, 2)}`);
        if (pgSlow.length > 0 || mongoSlow.length > 0) {
            // Placeholder: send alert (console/email/Slack)
            logger_1.default.warn('ALERT: Slow queries detected!');
            logToFile('ALERT: Slow queries detected!');
            alerts.push('Slow queries detected');
            await sendAlertEmail('PropertyAI DB Alert: Slow Queries Detected', `Slow queries detected:\n\nPostgres: ${JSON.stringify(pgSlow, null, 2)}\n\nMongo: ${JSON.stringify(mongoSlow, null, 2)}`);
        }
        // 2. Index suggestion (dry-run)
        const indexSuggestions = await databaseOptimization_service_1.databaseOptimizationService.createMissingIndexes(false);
        logToFile(`Index suggestions: ${JSON.stringify(indexSuggestions, null, 2)}`);
        if (indexSuggestions.length > 0) {
            alerts.push(`${indexSuggestions.length} index suggestions found`);
        }
        // 3. VACUUM ANALYZE (Postgres)
        await databaseOptimization_service_1.databaseOptimizationService.runVacuumAnalyze();
        logToFile('VACUUM ANALYZE completed.');
        // 4. Metrics logging
        const metrics = await databaseOptimization_service_1.databaseOptimizationService.getDatabaseMetrics();
        logToFile(`DB Metrics: ${JSON.stringify(metrics, null, 2)}`);
        // 5. Log to database for historical trend analysis
        await logToDatabase({ postgres: pgSlow, mongodb: mongoSlow }, indexSuggestions, metrics, alerts);
        logToFile('--- DB Optimization Run End ---');
        logger_1.default.info('DB Optimization Worker: All scheduled tasks completed.');
    }
    catch (err) {
        logger_1.default.error('DB Optimization Worker error: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
        logToFile('ERROR: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
    }
}
// Schedule: every day at 2am
node_cron_1.default.schedule('0 2 * * *', () => {
    runAllOptimizations();
});
// Also run immediately on startup
runAllOptimizations();
// Keep process alive
setInterval(() => { }, 1 << 30);
// To enable email alerts, set the following environment variables:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO, ALERT_EMAIL_FROM
// If not set, alerts will only be logged to console and file. 
//# sourceMappingURL=dbOptimizationWorker.js.map