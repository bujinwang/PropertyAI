import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { postgresConfig } from '../config/database.config';
import { config } from '../config/config';
import util from 'util';

const execPromise = util.promisify(exec);

// Initialize Prisma client with extended options
const prisma = new PrismaClient({
  log:
    postgresConfig.prisma.logQueries
      ? ['query', 'info', 'warn', 'error']
      : postgresConfig.prisma.logLevel === 'error'
      ? ['error']
      : [postgresConfig.prisma.logLevel as any],
  errorFormat: 'pretty',
});

export { prisma };

// Initialize S3 client for backups
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId || '',
    secretAccessKey: config.aws.secretAccessKey || '',
  },
});

// Function to validate database health
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Execute a simple query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check for locks if needed
    const locks = await prisma.$queryRaw`
      SELECT relation::regclass, mode, granted, pid, pg_blocking_pids(pid) as blocked_by
      FROM pg_locks l JOIN pg_stat_activity s ON l.pid = s.pid
      WHERE relation IS NOT NULL
      AND s.application_name = 'propertyai'
      AND pg_blocking_pids(pid) != '{}'
    `;
    
    if (Array.isArray(locks) && locks.length > 0) {
      console.warn('Found locks in the database:', locks);
    }
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Function to create a database backup
export const createDatabaseBackup = async (): Promise<string> => {
  if (!postgresConfig.backup.enabled) {
    console.log('Database backups are disabled');
    return '';
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `propertyai-${timestamp}.sql`;
    const backupFilePath = path.join(process.cwd(), 'backups', backupFileName);
    
    // Ensure backup directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'backups'))) {
      fs.mkdirSync(path.join(process.cwd(), 'backups'), { recursive: true });
    }
    
    // Get connection details
    const { host, port, database, user, password } = postgresConfig.connection;
    
    // Set environment variable for password
    process.env.PGPASSWORD = password;
    
    // Create backup command
    const backupCmd = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F p ${
      postgresConfig.backup.compressionEnabled ? '| gzip' : ''
    } > ${backupFilePath}${postgresConfig.backup.compressionEnabled ? '.gz' : ''}`;
    
    console.log(`Creating database backup: ${backupFileName}`);
    await execPromise(backupCmd);
    
    // Reset password environment variable
    delete process.env.PGPASSWORD;
    
    // If S3 backup is configured, upload to S3
    if (postgresConfig.backup.storageLocation.startsWith('s3://')) {
      const actualBackupPath = postgresConfig.backup.compressionEnabled 
        ? `${backupFilePath}.gz` 
        : backupFilePath;
      
      const fileContent = fs.readFileSync(actualBackupPath);
      const bucketPath = postgresConfig.backup.storageLocation.replace('s3://', '');
      const [bucket, ...keyParts] = bucketPath.split('/');
      const key = keyParts.length > 0 
        ? `${keyParts.join('/')}/${backupFileName}${postgresConfig.backup.compressionEnabled ? '.gz' : ''}` 
        : `${backupFileName}${postgresConfig.backup.compressionEnabled ? '.gz' : ''}`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ServerSideEncryption: postgresConfig.backup.encryptBackups ? 'AES256' : undefined,
      }));
      
      console.log(`Uploaded backup to S3: ${bucket}/${key}`);
      
      // Clean up local file after S3 upload
      fs.unlinkSync(actualBackupPath);
    }
    
    return backupFileName;
  } catch (error) {
    console.error('Failed to create database backup:', error);
    throw error;
  }
};

// Function to clean up old backups
export const cleanupOldBackups = async (): Promise<void> => {
  if (!postgresConfig.backup.enabled) return;
  
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) return;
    
    const files = fs.readdirSync(backupDir);
    const now = new Date().getTime();
    const retentionPeriodMs = postgresConfig.backup.retentionPeriodDays * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const fileAgeMs = now - stats.mtime.getTime();
      
      if (fileAgeMs > retentionPeriodMs) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error('Failed to clean up old backups:', error);
  }
};

// Function to configure scheduled backups
export const setupScheduledBackups = (): void => {
  if (!postgresConfig.backup.enabled) {
    console.log('Scheduled backups are disabled');
    return;
  }
  
  // Schedule backups according to cron pattern
  cron.schedule(postgresConfig.backup.schedule, async () => {
    try {
      console.log('Starting scheduled database backup...');
      await createDatabaseBackup();
      await cleanupOldBackups();
      console.log('Scheduled backup completed successfully');
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  });
  
  console.log(`Scheduled backups configured with pattern: ${postgresConfig.backup.schedule}`);
};

// Function to check and optimize database
export const optimizeDatabase = async (): Promise<void> => {
  try {
    console.log('Running database optimization...');
    
    // Run VACUUM ANALYZE to update statistics and reclaim space
    await prisma.$executeRawUnsafe('VACUUM ANALYZE');
    
    // Identify and log tables that might need index optimization
    const missingIndexes = await prisma.$queryRaw`
      SELECT
        schemaname || '.' || relname AS table,
        seq_scan,
        seq_tup_read,
        idx_scan,
        seq_tup_read / GREATEST(seq_scan, 1) AS avg_tuples_per_scan,
        n_live_tup
      FROM pg_stat_user_tables
      WHERE seq_scan > 50
      AND (seq_tup_read / GREATEST(seq_scan, 1)) > 100
      AND n_live_tup > 10000
      ORDER BY seq_tup_read DESC
      LIMIT 10;
    `;
    
    if (Array.isArray(missingIndexes) && missingIndexes.length > 0) {
      console.log('Tables that might benefit from index optimization:');
      console.table(missingIndexes);
    }
    
    // Identify and log slow queries if monitoring is enabled
    if (postgresConfig.monitoring.enabled) {
      const slowQueries = await prisma.$queryRaw`
        SELECT
          query,
          calls,
          total_exec_time,
          min_exec_time,
          max_exec_time,
          mean_exec_time,
          stddev_exec_time,
          rows
        FROM pg_stat_statements
        WHERE total_exec_time > ${postgresConfig.monitoring.slowQueryThreshold}
        ORDER BY total_exec_time DESC
        LIMIT 10;
      `;
      
      if (Array.isArray(slowQueries) && slowQueries.length > 0) {
        console.log('Slow queries detected:');
        console.table(slowQueries);
      }
    }
    
    console.log('Database optimization completed');
  } catch (error) {
    console.error('Database optimization failed:', error);
  }
};

// Function to apply security settings
export const applySecuritySettings = async (): Promise<void> => {
  try {
    console.log('Applying database security settings...');
    
    // Enable query logging for audit purposes if configured
    if (postgresConfig.security.auditLoggingEnabled) {
      await prisma.$executeRawUnsafe(`
        ALTER SYSTEM SET log_statement = 'mod';
        ALTER SYSTEM SET log_min_duration_statement = '1000';
        SELECT pg_reload_conf();
      `);
      console.log('Audit logging enabled');
    }
    
    // Set statement timeout to prevent long-running queries
    await prisma.$executeRawUnsafe(`
      ALTER DATABASE ${postgresConfig.connection.database} SET statement_timeout = '${postgresConfig.connection.statementTimeout}ms';
    `);
    
    // Configure connection limits if needed in production
    if (process.env.NODE_ENV === 'production') {
      await prisma.$executeRawUnsafe(`
        ALTER SYSTEM SET max_connections = '100';
        ALTER SYSTEM SET idle_in_transaction_session_timeout = '60000';
        SELECT pg_reload_conf();
      `);
    }
    
    console.log('Database security settings applied');
  } catch (error) {
    console.error('Failed to apply security settings:', error);
  }
};

// Function to initialize database with recommended settings
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database with recommended settings...');
    
    // Create extensions if needed
    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);
    
    // Apply performance settings
    await prisma.$executeRawUnsafe(`
      ALTER SYSTEM SET shared_buffers = '128MB';
      ALTER SYSTEM SET work_mem = '4MB';
      ALTER SYSTEM SET maintenance_work_mem = '64MB';
      ALTER SYSTEM SET random_page_cost = 1.1;
      ALTER SYSTEM SET effective_cache_size = '1GB';
      SELECT pg_reload_conf();
    `);
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};

export default {
  prisma,
  checkDatabaseHealth,
  createDatabaseBackup,
  cleanupOldBackups,
  setupScheduledBackups,
  optimizeDatabase,
  applySecuritySettings,
  initializeDatabase,
};
