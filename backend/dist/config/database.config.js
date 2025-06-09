"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleCreationSQL = exports.getDatabaseUrl = exports.buildConnectionUrl = exports.postgresConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Initialize dotenv to load environment variables from .env file
dotenv_1.default.config();
// PostgreSQL connection pool configuration
exports.postgresConfig = {
    // Connection parameters
    connection: {
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || '5432'),
        database: process.env.PG_DATABASE || 'propertyai',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'postgres',
        ssl: process.env.PG_SSL === 'true' ? {
            rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
        } : false,
        connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '10000'),
        statementTimeout: parseInt(process.env.PG_STATEMENT_TIMEOUT || '30000'),
        idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000'),
    },
    // Connection pool settings
    pool: {
        min: parseInt(process.env.PG_POOL_MIN || '2'),
        max: parseInt(process.env.PG_POOL_MAX || '10'),
        acquire: parseInt(process.env.PG_POOL_ACQUIRE || '60000'),
        idle: parseInt(process.env.PG_POOL_IDLE || '10000'),
    },
    // Prisma-specific settings
    prisma: {
        logLevel: process.env.PRISMA_LOG_LEVEL || 'error',
        logQueries: process.env.PRISMA_LOG_QUERIES === 'true',
        slowQueryThreshold: parseInt(process.env.PRISMA_SLOW_QUERY_MS || '1000'),
    },
    // Security settings
    security: {
        encryptionEnabled: process.env.PG_ENCRYPTION_ENABLED === 'true',
        encryptionKey: process.env.PG_ENCRYPTION_KEY || '',
        dataAtRestEncryption: process.env.PG_DATA_AT_REST_ENCRYPTION === 'true',
        auditLoggingEnabled: process.env.PG_AUDIT_LOGGING === 'true',
        ipWhitelist: process.env.PG_IP_WHITELIST ? process.env.PG_IP_WHITELIST.split(',') : [],
    },
    // Backup configuration
    backup: {
        enabled: process.env.PG_BACKUP_ENABLED === 'true',
        schedule: process.env.PG_BACKUP_SCHEDULE || '0 0 * * *', // Default: daily at midnight (cron format)
        retentionPeriodDays: parseInt(process.env.PG_BACKUP_RETENTION_DAYS || '30'),
        storageLocation: process.env.PG_BACKUP_STORAGE || 's3://propertyai-backups/postgres',
        compressionEnabled: process.env.PG_BACKUP_COMPRESSION === 'true',
        encryptBackups: process.env.PG_BACKUP_ENCRYPTION === 'true',
    },
    // Performance monitoring
    monitoring: {
        enabled: process.env.PG_MONITORING_ENABLED === 'true',
        slowQueryThreshold: parseInt(process.env.PG_SLOW_QUERY_MS || '1000'),
        queryStatsRetentionDays: parseInt(process.env.PG_QUERY_STATS_RETENTION_DAYS || '7'),
        alertingEnabled: process.env.PG_ALERTING_ENABLED === 'true',
    }
};
// Build the connection URL from individual parameters if DATABASE_URL is not provided
const buildConnectionUrl = () => {
    const { host, port, database, user, password } = exports.postgresConfig.connection;
    const sslParam = exports.postgresConfig.connection.ssl ? '?sslmode=require' : '';
    return `postgresql://${user}:${password}@${host}:${port}/${database}${sslParam}`;
};
exports.buildConnectionUrl = buildConnectionUrl;
// Database URL for Prisma
const getDatabaseUrl = () => {
    return process.env.DATABASE_URL || (0, exports.buildConnectionUrl)();
};
exports.getDatabaseUrl = getDatabaseUrl;
// Generate PostgreSQL role creation SQL
const getRoleCreationSQL = () => {
    // This would be used for initializing the database with proper roles
    return `
-- Application roles
CREATE ROLE propertyai_admin WITH LOGIN PASSWORD '${process.env.PG_ADMIN_PASSWORD || 'admin_password'}';
CREATE ROLE propertyai_app WITH LOGIN PASSWORD '${process.env.PG_APP_PASSWORD || 'app_password'}';
CREATE ROLE propertyai_readonly WITH LOGIN PASSWORD '${process.env.PG_READONLY_PASSWORD || 'readonly_password'}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${exports.postgresConfig.connection.database} TO propertyai_admin;
GRANT CONNECT ON DATABASE ${exports.postgresConfig.connection.database} TO propertyai_app;
GRANT CONNECT ON DATABASE ${exports.postgresConfig.connection.database} TO propertyai_readonly;

-- Connect to the database and set up schema permissions
\\c ${exports.postgresConfig.connection.database}

-- Schema privileges for application role
GRANT USAGE ON SCHEMA public TO propertyai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO propertyai_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO propertyai_app;

-- Read-only privileges
GRANT USAGE ON SCHEMA public TO propertyai_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO propertyai_readonly;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO propertyai_app;
  
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO propertyai_readonly;
  
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO propertyai_app;
`;
};
exports.getRoleCreationSQL = getRoleCreationSQL;
//# sourceMappingURL=database.config.js.map