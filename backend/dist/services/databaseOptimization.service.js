"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseOptimizationService = exports.DatabaseOptimizationService = void 0;
const client_1 = require("@prisma/client");
const ioredis_1 = require("ioredis");
const mongoose_1 = __importDefault(require("mongoose"));
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * DatabaseOptimizationService
 *
 * A comprehensive service for monitoring and optimizing database performance
 * across both PostgreSQL and MongoDB databases in the PropertyAI platform.
 */
class DatabaseOptimizationService {
    constructor(prisma, redisUrl) {
        this.prisma = prisma;
        this.redis = new ioredis_1.Redis(redisUrl);
        // Create logs directory if it doesn't exist
        const logsDir = path_1.default.join(__dirname, '../../logs/database');
        if (!fs_1.default.existsSync(logsDir)) {
            fs_1.default.mkdirSync(logsDir, { recursive: true });
        }
        this.queryLogPath = path_1.default.join(logsDir, 'slow-queries.json');
        this.optimizationHistoryPath = path_1.default.join(logsDir, 'optimization-history.json');
    }
    /**
     * Analyze PostgreSQL slow queries and provide optimization recommendations
     */
    async analyzePostgresSlowQueries() {
        try {
            logger_1.default.info('Analyzing PostgreSQL slow queries');
            // Ensure pg_stat_statements extension is enabled
            await this.prisma.$executeRawUnsafe(`
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
      `);
            // Query for slow queries
            const slowQueries = await this.prisma.$queryRaw `
        SELECT
          query,
          calls,
          total_exec_time,
          min_exec_time,
          max_exec_time,
          mean_exec_time,
          stddev_exec_time,
          rows,
          shared_blks_hit,
          shared_blks_read,
          shared_blks_dirtied,
          shared_blks_written,
          temp_blks_read,
          temp_blks_written
        FROM pg_stat_statements
        WHERE total_exec_time > ${database_config_1.postgresConfig.monitoring.slowQueryThreshold}
        ORDER BY total_exec_time DESC
        LIMIT 50;
      `;
            // Log slow queries
            this.logSlowQueries('postgres', slowQueries);
            // Analyze each slow query and provide recommendations
            const analyzedQueries = [];
            for (const query of slowQueries) {
                const recommendations = await this.getQueryOptimizationRecommendations(query.query);
                analyzedQueries.push({
                    ...query,
                    recommendations
                });
            }
            return analyzedQueries;
        }
        catch (error) {
            logger_1.default.error('Error analyzing PostgreSQL slow queries: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            throw error;
        }
    }
    /**
     * Analyze MongoDB slow queries and provide optimization recommendations
     */
    async analyzeMongoSlowQueries() {
        try {
            logger_1.default.info('Analyzing MongoDB slow queries');
            if (!mongoose_1.default.connection.db) {
                throw new Error('MongoDB connection not established');
            }
            const db = mongoose_1.default.connection.db;
            // Optionally enable profiling if needed (skip if config not available)
            // Example: await db.command({ profile: 1, slowms: 100 });
            // Query for slow operations
            const slowQueries = await db.collection('system.profile')
                .find({})
                .sort({ millis: -1 })
                .limit(50)
                .toArray();
            // Log slow queries
            this.logSlowQueries('mongodb', slowQueries);
            // Analyze each slow query and provide recommendations
            const analyzedQueries = [];
            for (const query of slowQueries) {
                const recommendations = this.getMongoQueryOptimizationRecommendations(query);
                analyzedQueries.push({
                    ...query,
                    recommendations
                });
            }
            return analyzedQueries;
        }
        catch (error) {
            logger_1.default.error('Error analyzing MongoDB slow queries: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            throw error;
        }
    }
    /**
     * Get optimization recommendations for PostgreSQL query
     */
    async getQueryOptimizationRecommendations(query) {
        try {
            const recommendations = [];
            // Run EXPLAIN ANALYZE to get query plan
            const explainResult = await this.prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${query}`);
            // Analyze query plan for common issues
            const queryPlan = JSON.stringify(explainResult);
            // Check for sequential scans
            if (queryPlan.includes('Seq Scan')) {
                recommendations.push('Consider adding an index to avoid sequential scan');
            }
            // Check for hash joins on large tables
            if (queryPlan.includes('Hash Join')) {
                recommendations.push('Review join conditions and consider adding indexes on join columns');
            }
            // Check for high filter costs
            if (queryPlan.includes('Filter') && queryPlan.includes('cost=')) {
                recommendations.push('Review WHERE clause conditions and add indexes on frequently filtered columns');
            }
            // If no specific recommendations, provide general advice
            if (recommendations.length === 0) {
                recommendations.push('Review query structure and consider denormalizing data for read-heavy operations');
                recommendations.push('Consider adding materialized views for complex aggregations');
            }
            return recommendations;
        }
        catch (error) {
            logger_1.default.error('Error getting query optimization recommendations: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            return ['Error analyzing query plan. Manual review recommended.'];
        }
    }
    /**
     * Get optimization recommendations for MongoDB query
     */
    getMongoQueryOptimizationRecommendations(queryProfile) {
        const recommendations = [];
        // Check if query used an index
        if (!queryProfile.indexUsed) {
            recommendations.push(`Create an index for the collection ${queryProfile.ns} on queried fields`);
        }
        // Check for excessive documents scanned
        if (queryProfile.docsExamined > 1000 && queryProfile.nreturned < queryProfile.docsExamined / 10) {
            recommendations.push('Query is examining too many documents relative to results. Improve index coverage.');
        }
        // Check for sorts without indexes
        if (queryProfile.command && queryProfile.command.sort && !queryProfile.indexUsed) {
            recommendations.push('Add an index to support the sort operation and avoid in-memory sorting');
        }
        // Check for inefficient aggregation pipelines
        if (queryProfile.op === 'command' && queryProfile.command && queryProfile.command.aggregate) {
            recommendations.push('Review aggregation pipeline for optimization opportunities');
        }
        // If no specific recommendations, provide general advice
        if (recommendations.length === 0) {
            recommendations.push('Consider using projection to limit returned fields');
            recommendations.push('Review query patterns and data model for potential denormalization');
        }
        return recommendations;
    }
    /**
     * Sanitize a SQL query to remove potentially sensitive data
     * @param query SQL query to sanitize
     * @returns Sanitized query
     */
    sanitizeQuery(query) {
        if (!query)
            return '';
        // Replace potential email addresses
        let sanitized = query.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
        // Replace potential phone numbers
        sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
        // Replace potential credit card numbers
        sanitized = sanitized.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CREDIT_CARD]');
        // Replace potential SSNs
        sanitized = sanitized.replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '[SSN]');
        // Replace potential API keys (alphanumeric strings of certain length)
        sanitized = sanitized.replace(/\b[A-Za-z0-9_-]{20,40}\b/g, '[API_KEY]');
        // Replace potential passwords in INSERT/UPDATE statements
        sanitized = sanitized.replace(/(?:password|passwd|pwd)(\s*=\s*|\s+IS\s+|\s*>\s*|\s*<\s*|\s*>=\s*|\s*<=\s*|\s*<>\s*|\s*!=\s*|\s*LIKE\s+)(\s*)['"](.*?)['"]/, 'password$1$2[REDACTED]');
        // Replace potential tokens
        sanitized = sanitized.replace(/(?:token|access_token|refresh_token|jwt)(\s*=\s*|\s+IS\s+)(\s*)['"](.*?)['"]/, 'token$1$2[REDACTED]');
        return sanitized;
    }
    /**
     * Log slow queries with sanitized content
     */
    logSlowQueries(dbType, queries) {
        try {
            // Sanitize queries before logging
            const sanitizedQueries = queries.map(q => {
                if (dbType === 'postgres' && q.query) {
                    return { ...q, query: this.sanitizeQuery(q.query) };
                }
                return q;
            });
            // Get existing logs or initialize
            let logs = [];
            if (fs_1.default.existsSync(this.queryLogPath)) {
                try {
                    const logsContent = fs_1.default.readFileSync(this.queryLogPath, 'utf8');
                    logs = JSON.parse(logsContent);
                }
                catch (err) {
                    logger_1.default.warn('Error reading query logs, starting fresh');
                }
            }
            // Add new logs with timestamp
            logs.push({
                timestamp: new Date().toISOString(),
                dbType,
                queries: sanitizedQueries
            });
            // Keep only the last 100 log entries
            if (logs.length > 100) {
                logs = logs.slice(-100);
            }
            // Write back to file
            fs_1.default.writeFileSync(this.queryLogPath, JSON.stringify(logs, null, 2));
        }
        catch (error) {
            logger_1.default.error('Error logging slow queries: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
        }
    }
    /**
     * Create missing indexes based on slow query analysis
     * @param execute If true, actually create the suggested indexes (default: false)
     * @returns Array of index suggestions or creation results
     */
    async createMissingIndexes(execute = false) {
        try {
            logger_1.default.info('Analyzing and creating missing indexes');
            const createdIndexes = [];
            // --- PostgreSQL: Suggest and optionally create indexes ---
            // Find columns involved in sequential scans
            const missingPgIndexes = await this.prisma.$queryRaw `
        SELECT
          relname AS table_name,
          attname AS column_name,
          n_live_tup,
          seq_scan,
          idx_scan
        FROM pg_stat_user_tables t
        JOIN pg_attribute a ON t.relid = a.attrelid
        WHERE a.attnum > 0 AND NOT a.attisdropped
          AND t.seq_scan > 50
          AND t.idx_scan < t.seq_scan
          AND t.n_live_tup > 10000
        ORDER BY t.seq_scan DESC
        LIMIT 10;
      `;
            for (const row of missingPgIndexes) {
                const indexName = `idx_${row.table_name}_${row.column_name}`;
                const sql = `CREATE INDEX IF NOT EXISTS \"${indexName}\" ON \"${row.table_name}\" (\"${row.column_name}\");`;
                if (execute) {
                    try {
                        await this.prisma.$executeRawUnsafe(sql);
                        createdIndexes.push(`Created: ${sql}`);
                    }
                    catch (err) {
                        createdIndexes.push(`Failed: ${sql} - ${err instanceof Error ? err.message : String(err)}`);
                    }
                }
                else {
                    createdIndexes.push(sql);
                }
            }
            // --- MongoDB: Suggest and optionally create indexes ---
            if (mongoose_1.default.connection.db) {
                const db = mongoose_1.default.connection.db;
                const collections = await db.listCollections().toArray();
                for (const collection of collections) {
                    const collStats = await db.command({ collStats: collection.name });
                    const indexes = await db.collection(collection.name).indexes();
                    // If collection has >10k docs and only _id index
                    if (collStats.count > 10000 && indexes.length <= 1) {
                        // Try to find most common field in slow queries
                        const profile = await db.collection('system.profile').find({ ns: `${db.databaseName}.${collection.name}` }).sort({ millis: -1 }).limit(5).toArray();
                        let suggestedField = null;
                        for (const prof of profile) {
                            if (prof.query) {
                                const keys = Object.keys(prof.query);
                                if (keys.length > 0) {
                                    suggestedField = keys[0];
                                    break;
                                }
                            }
                        }
                        if (suggestedField) {
                            const cmd = `db.getCollection(\"${collection.name}\").createIndex({ \"${suggestedField}\": 1 })`;
                            if (execute) {
                                try {
                                    await db.collection(collection.name).createIndex({ [suggestedField]: 1 });
                                    createdIndexes.push(`Created: ${cmd}`);
                                }
                                catch (err) {
                                    createdIndexes.push(`Failed: ${cmd} - ${err instanceof Error ? err.message : String(err)}`);
                                }
                            }
                            else {
                                createdIndexes.push(cmd);
                            }
                        }
                        else {
                            createdIndexes.push(`Suggest: db.getCollection(\"${collection.name}\").createIndex({ /* field */: 1 })`);
                        }
                    }
                }
            }
            this.logOptimizationAction('analyze_and_create_missing_indexes', { createdIndexes, execute });
            return createdIndexes;
        }
        catch (error) {
            logger_1.default.error('Error creating missing indexes: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            throw error;
        }
    }
    /**
     * Optimize database connections and pooling
     */
    async optimizeConnections() {
        try {
            logger_1.default.info('Optimizing database connections');
            // For PostgreSQL, analyze connection pool usage
            const pgConnectionStats = await this.prisma.$queryRaw `
        SELECT 
          count(*) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_activity;
      `;
            this.logOptimizationAction('connection_pool_analysis', { pgConnectionStats });
            // For MongoDB, check connection pool status
            if (mongoose_1.default.connection.db) {
                const mongoStatus = await mongoose_1.default.connection.db.command({ serverStatus: 1 });
                const mongoConnections = mongoStatus.connections;
                this.logOptimizationAction('mongo_connection_analysis', { mongoConnections });
            }
        }
        catch (error) {
            logger_1.default.error('Error optimizing connections: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            throw error;
        }
    }
    /**
     * Log optimization actions for auditing and historical analysis
     */
    logOptimizationAction(action, details) {
        try {
            let history = [];
            // Read existing history if available
            if (fs_1.default.existsSync(this.optimizationHistoryPath)) {
                const fileContent = fs_1.default.readFileSync(this.optimizationHistoryPath, 'utf8');
                history = JSON.parse(fileContent);
            }
            // Add new action with timestamp
            const newAction = {
                timestamp: new Date().toISOString(),
                action,
                details
            };
            history.push(newAction);
            // Keep only the last 100 actions to prevent file growth
            if (history.length > 100) {
                history = history.slice(-100);
            }
            // Write updated history
            fs_1.default.writeFileSync(this.optimizationHistoryPath, JSON.stringify(history, null, 2));
        }
        catch (error) {
            logger_1.default.error('Error logging optimization action: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
        }
    }
    /**
     * Run VACUUM ANALYZE on PostgreSQL database
     */
    async runVacuumAnalyze() {
        try {
            logger_1.default.info('Running VACUUM ANALYZE on PostgreSQL database');
            await this.prisma.$executeRawUnsafe('VACUUM ANALYZE');
            this.logOptimizationAction('vacuum_analyze', {
                success: true,
                timestamp: new Date().toISOString()
            });
            logger_1.default.info('VACUUM ANALYZE completed successfully');
        }
        catch (error) {
            logger_1.default.error('Error running VACUUM ANALYZE: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            this.logOptimizationAction('vacuum_analyze', {
                success: false,
                error: (error === null || error === void 0 ? void 0 : error.message) || error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    /**
     * Get database performance metrics
     */
    async getDatabaseMetrics() {
        try {
            const metrics = {
                postgres: {},
                mongodb: {}
            };
            // PostgreSQL metrics
            const pgMetrics = await this.prisma.$queryRaw `
        SELECT
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT sum(xact_commit) FROM pg_stat_database) as transactions_committed,
          (SELECT sum(xact_rollback) FROM pg_stat_database) as transactions_rolled_back,
          (SELECT sum(blks_read) FROM pg_stat_database) as blocks_read,
          (SELECT sum(blks_hit) FROM pg_stat_database) as blocks_hit,
          (SELECT sum(tup_returned) FROM pg_stat_database) as rows_returned,
          (SELECT sum(tup_fetched) FROM pg_stat_database) as rows_fetched,
          (SELECT sum(tup_inserted) FROM pg_stat_database) as rows_inserted,
          (SELECT sum(tup_updated) FROM pg_stat_database) as rows_updated,
          (SELECT sum(tup_deleted) FROM pg_stat_database) as rows_deleted
      `;
            metrics.postgres = pgMetrics[0] || {};
            // Calculate cache hit ratio
            if (metrics.postgres.blocks_read > 0 || metrics.postgres.blocks_hit > 0) {
                metrics.postgres.cache_hit_ratio = metrics.postgres.blocks_hit /
                    (metrics.postgres.blocks_hit + metrics.postgres.blocks_read);
            }
            // MongoDB metrics
            if (mongoose_1.default.connection.db) {
                const db = mongoose_1.default.connection.db;
                const serverStatus = await db.command({ serverStatus: 1 });
                metrics.mongodb = {
                    connections: serverStatus.connections,
                    network: serverStatus.network,
                    opcounters: serverStatus.opcounters,
                    mem: serverStatus.mem,
                    wiredTiger: serverStatus.wiredTiger ? {
                        cache: serverStatus.wiredTiger.cache,
                        concurrentTransactions: serverStatus.wiredTiger.concurrentTransactions
                    } : null
                };
            }
            return metrics;
        }
        catch (error) {
            logger_1.default.error('Error getting database metrics: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            throw error;
        }
    }
    /**
     * Detect unused and redundant indexes in PostgreSQL and MongoDB
     * @returns Array of unused/redundant index details and recommendations
     */
    async detectUnusedIndexes() {
        try {
            logger_1.default.info('Detecting unused and redundant indexes');
            const unusedIndexes = [];
            // --- PostgreSQL: Find unused and redundant indexes ---
            const pgUnusedIndexes = await this.prisma.$queryRaw `
        SELECT
          schemaname,
          relname AS table_name,
          indexrelname AS index_name,
          idx_scan,
          pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
          pg_relation_size(i.indexrelid) AS index_size_bytes,
          indexdef
        FROM pg_stat_user_indexes ui
        JOIN pg_index i ON ui.indexrelid = i.indexrelid
        JOIN pg_indexes AS idx ON idx.indexname = ui.indexrelname
          AND idx.schemaname = ui.schemaname
        WHERE
          -- Exclude primary keys and unique constraints
          NOT indisprimary AND NOT indisunique
          -- Indexes with very few scans relative to table size
          AND idx_scan < 50
          -- Tables with at least some rows
          AND n_live_tup > 1000
        ORDER BY pg_relation_size(i.indexrelid) DESC
        LIMIT 20;
      `;
            // --- PostgreSQL: Find redundant indexes (overlapping indexes) ---
            const pgRedundantIndexes = await this.prisma.$queryRaw `
        WITH index_cols AS (
          SELECT
            i.indrelid::regclass::text AS table_name,
            i.indexrelid::regclass::text AS index_name,
            array_agg(a.attname::text ORDER BY array_position(i.indkey, a.attnum)) AS columns,
            pg_get_indexdef(i.indexrelid) AS index_def,
            pg_relation_size(i.indexrelid) AS index_size_bytes,
            pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
            s.idx_scan
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          JOIN pg_stat_user_indexes s ON s.indexrelid = i.indexrelid
          WHERE i.indrelid::regclass::text NOT LIKE 'pg_%'
          GROUP BY i.indrelid, i.indexrelid, s.idx_scan
        )
        SELECT
          a.table_name,
          a.index_name AS index_name_a,
          b.index_name AS index_name_b,
          a.columns AS columns_a,
          b.columns AS columns_b,
          a.index_def AS index_def_a,
          b.index_def AS index_def_b,
          a.index_size AS index_size_a,
          b.index_size AS index_size_b,
          a.idx_scan AS idx_scan_a,
          b.idx_scan AS idx_scan_b,
          CASE 
            WHEN a.idx_scan > b.idx_scan THEN b.index_name
            ELSE a.index_name
          END AS suggested_drop_index
        FROM index_cols a
        JOIN index_cols b ON a.table_name = b.table_name
          AND a.index_name < b.index_name
          AND (
            -- One index's columns are a prefix of the other's
            (a.columns <@ b.columns OR b.columns <@ a.columns)
            -- Or they have the same columns in different order
            OR (a.columns @> b.columns AND a.columns <@ b.columns)
          )
        ORDER BY a.table_name, a.index_name, b.index_name
        LIMIT 20;
      `;
            // Process PostgreSQL unused indexes
            for (const idx of pgUnusedIndexes) {
                unusedIndexes.push({
                    type: 'unused',
                    database: 'postgres',
                    table_name: idx.table_name,
                    index_name: idx.index_name,
                    scans: idx.idx_scan,
                    size: idx.index_size,
                    recommendation: `Consider dropping unused index: DROP INDEX IF EXISTS "${idx.index_name}";`,
                    details: `This index has only been used ${idx.idx_scan} times and takes up ${idx.index_size} of space.`
                });
            }
            // Process PostgreSQL redundant indexes
            for (const idx of pgRedundantIndexes) {
                unusedIndexes.push({
                    type: 'redundant',
                    database: 'postgres',
                    table_name: idx.table_name,
                    index_pair: `${idx.index_name_a} and ${idx.index_name_b}`,
                    recommendation: `Consider dropping redundant index: DROP INDEX IF EXISTS "${idx.suggested_drop_index}";`,
                    details: `Index ${idx.index_name_a} (${idx.columns_a.join(', ')}) overlaps with ${idx.index_name_b} (${idx.columns_b.join(', ')}). The less used index can be dropped.`
                });
            }
            // --- MongoDB: Find unused indexes ---
            if (mongoose_1.default.connection.db) {
                const db = mongoose_1.default.connection.db;
                const collections = await db.listCollections().toArray();
                for (const collection of collections) {
                    const collName = collection.name;
                    // Skip system collections
                    if (collName.startsWith('system.'))
                        continue;
                    const indexes = await db.collection(collName).indexes();
                    const indexStats = await db.command({
                        aggregate: collName,
                        pipeline: [{ $indexStats: {} }],
                        cursor: {}
                    });
                    // Process each index
                    for (const idx of indexes) {
                        // Skip _id index
                        if (idx.name === '_id_')
                            continue;
                        // Find stats for this index
                        const stats = indexStats.cursor.firstBatch.find((s) => s.name === idx.name);
                        // If index hasn't been used or has very low usage
                        if (!stats || stats.accesses.ops < 10) {
                            unusedIndexes.push({
                                type: 'unused',
                                database: 'mongodb',
                                collection: collName,
                                index_name: idx.name,
                                keys: JSON.stringify(idx.key),
                                accesses: stats ? stats.accesses.ops : 0,
                                recommendation: `Consider dropping unused index: db.${collName}.dropIndex("${idx.name}")`,
                                details: `This index has only been used ${stats ? stats.accesses.ops : 0} times since last server restart.`
                            });
                        }
                    }
                }
            }
            return unusedIndexes;
        }
        catch (error) {
            logger_1.default.error('Error detecting unused indexes: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            throw error;
        }
    }
    /**
     * Analyze and store query execution plans for slow queries
     * @param compareWithPrevious If true, compare with previous plans to detect regressions
     * @returns Analysis results with optimization recommendations
     */
    async analyzeQueryPlans(compareWithPrevious = true) {
        try {
            logger_1.default.info('Analyzing query execution plans');
            const results = [];
            // Get slow queries from PostgreSQL
            const slowQueries = await this.prisma.$queryRaw `
        SELECT
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          rows,
          shared_blks_read,
          shared_blks_hit
        FROM pg_stat_statements
        WHERE total_exec_time > ${database_config_1.postgresConfig.monitoring.slowQueryThreshold}
        AND query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_exec_time DESC
        LIMIT 10;
      `;
            // Store for plans and analysis
            const plansDir = path_1.default.join(__dirname, '../../logs/database/plans');
            if (!fs_1.default.existsSync(plansDir)) {
                fs_1.default.mkdirSync(plansDir, { recursive: true });
            }
            // Process each slow query
            for (const query of slowQueries) {
                try {
                    // Skip queries that can't be explained (e.g., INSERT, UPDATE without RETURNING)
                    if (!this.canExplainQuery(query.query)) {
                        continue;
                    }
                    // Get query hash for identification
                    const queryHash = this.getQueryHash(query.query);
                    const planFile = path_1.default.join(plansDir, `plan_${queryHash}.json`);
                    // Get the execution plan
                    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query.query}`;
                    const explainResult = await this.prisma.$queryRawUnsafe(explainQuery);
                    // Extract the plan from the result
                    const plan = explainResult[0]['QUERY PLAN'][0];
                    // Store the current plan
                    const currentPlan = {
                        timestamp: new Date().toISOString(),
                        queryHash,
                        query: query.query,
                        plan,
                        metrics: {
                            calls: query.calls,
                            total_exec_time: query.total_exec_time,
                            mean_exec_time: query.mean_exec_time,
                            rows: query.rows
                        }
                    };
                    // Analyze the plan for common issues
                    const planAnalysis = this.analyzePlan(plan);
                    // Check for regressions if requested
                    let regressions = [];
                    if (compareWithPrevious && fs_1.default.existsSync(planFile)) {
                        try {
                            const previousPlanData = JSON.parse(fs_1.default.readFileSync(planFile, 'utf8'));
                            regressions = this.detectPlanRegressions(previousPlanData.plan, plan);
                        }
                        catch (err) {
                            logger_1.default.error('Error comparing with previous plan: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
                        }
                    }
                    // Save the current plan
                    fs_1.default.writeFileSync(planFile, JSON.stringify(currentPlan, null, 2));
                    // Add to results
                    results.push({
                        queryHash,
                        query: query.query.substring(0, 200) + (query.query.length > 200 ? '...' : ''),
                        metrics: {
                            calls: query.calls,
                            total_exec_time: query.total_exec_time,
                            mean_exec_time: query.mean_exec_time,
                            rows: query.rows
                        },
                        analysis: planAnalysis,
                        regressions,
                        recommendations: [
                            ...planAnalysis.map(issue => issue.recommendation),
                            ...regressions.map(reg => reg.recommendation)
                        ]
                    });
                }
                catch (err) {
                    logger_1.default.error(`Error analyzing plan for query: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
                }
            }
            return results;
        }
        catch (error) {
            logger_1.default.error('Error analyzing query plans: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            throw error;
        }
    }
    /**
     * Check if a query can be explained (SELECT, UPDATE/DELETE/INSERT with RETURNING)
     */
    canExplainQuery(query) {
        const normalizedQuery = query.trim().toUpperCase();
        return normalizedQuery.startsWith('SELECT') ||
            normalizedQuery.includes(' RETURNING ');
    }
    /**
     * Generate a hash for a query to use as an identifier
     */
    getQueryHash(query) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(query).digest('hex').substring(0, 10);
    }
    /**
     * Analyze a query execution plan for common issues
     */
    analyzePlan(plan) {
        const issues = [];
        // Extract the actual plan
        const planNode = plan.Plan;
        if (!planNode)
            return issues;
        // Check for sequential scans on large tables
        this.findSequentialScans(planNode, issues);
        // Check for hash joins without proper indexes
        this.findHashJoins(planNode, issues);
        // Check for high filter costs
        this.findExpensiveFilters(planNode, issues);
        // Check for inefficient sorts
        this.findIneffcientSorts(planNode, issues);
        return issues;
    }
    /**
     * Find sequential scans in the plan
     */
    findSequentialScans(node, issues) {
        if (node['Node Type'] === 'Seq Scan' && node['Actual Rows'] > 1000) {
            issues.push({
                type: 'sequential_scan',
                table: node['Relation Name'],
                rows: node['Actual Rows'],
                cost: node['Total Cost'],
                recommendation: `Consider adding an index on table "${node['Relation Name']}" to avoid sequential scan`
            });
        }
        // Recursively check child nodes
        if (node.Plans) {
            for (const childNode of node.Plans) {
                this.findSequentialScans(childNode, issues);
            }
        }
    }
    /**
     * Find hash joins that might benefit from indexes
     */
    findHashJoins(node, issues) {
        if (node['Node Type'] === 'Hash Join' && node['Total Cost'] > 1000) {
            // Check if any child is a sequential scan
            let seqScanFound = false;
            let seqScanTable = '';
            if (node.Plans) {
                for (const childNode of node.Plans) {
                    if (childNode['Node Type'] === 'Seq Scan') {
                        seqScanFound = true;
                        seqScanTable = childNode['Relation Name'];
                        break;
                    }
                }
            }
            if (seqScanFound) {
                issues.push({
                    type: 'hash_join_without_index',
                    table: seqScanTable,
                    cost: node['Total Cost'],
                    recommendation: `Consider adding an index on the join columns of table "${seqScanTable}" to improve hash join performance`
                });
            }
        }
        // Recursively check child nodes
        if (node.Plans) {
            for (const childNode of node.Plans) {
                this.findHashJoins(childNode, issues);
            }
        }
    }
    /**
     * Find expensive filter operations
     */
    findExpensiveFilters(node, issues) {
        if (node['Node Type'] && node['Filter'] && node['Actual Rows'] < node['Rows'] / 10) {
            issues.push({
                type: 'expensive_filter',
                filter: node['Filter'],
                estimated_rows: node['Rows'],
                actual_rows: node['Actual Rows'],
                recommendation: `Consider adding an index to support filter: ${node['Filter']}`
            });
        }
        // Recursively check child nodes
        if (node.Plans) {
            for (const childNode of node.Plans) {
                this.findExpensiveFilters(childNode, issues);
            }
        }
    }
    /**
     * Find inefficient sort operations
     */
    findIneffcientSorts(node, issues) {
        if (node['Node Type'] === 'Sort' && node['Sort Method'] !== 'Index Scan') {
            issues.push({
                type: 'inefficient_sort',
                sort_key: node['Sort Key'],
                sort_method: node['Sort Method'],
                sort_space: node['Sort Space Used'] ? `${node['Sort Space Used']} KB` : 'Unknown',
                recommendation: `Consider adding an index on columns (${node['Sort Key'].join(', ')}) to avoid in-memory sorting`
            });
        }
        // Recursively check child nodes
        if (node.Plans) {
            for (const childNode of node.Plans) {
                this.findIneffcientSorts(childNode, issues);
            }
        }
    }
    /**
     * Detect regressions between an old and new query plan
     */
    detectPlanRegressions(oldPlan, newPlan) {
        const regressions = [];
        // Compare execution time if available
        if (oldPlan['Execution Time'] && newPlan['Execution Time']) {
            const oldTime = oldPlan['Execution Time'];
            const newTime = newPlan['Execution Time'];
            // If new plan is significantly slower (25% or more)
            if (newTime > oldTime * 1.25) {
                regressions.push({
                    type: 'execution_time_regression',
                    old_time: `${oldTime.toFixed(2)} ms`,
                    new_time: `${newTime.toFixed(2)} ms`,
                    increase: `${((newTime - oldTime) / oldTime * 100).toFixed(1)}%`,
                    recommendation: 'Query performance has regressed. Consider reverting recent schema or query changes.'
                });
            }
        }
        // Compare plan types (e.g., if plan changed from Index Scan to Sequential Scan)
        if (oldPlan.Plan && newPlan.Plan) {
            const oldNodeType = this.getPlanNodeTypes(oldPlan.Plan);
            const newNodeType = this.getPlanNodeTypes(newPlan.Plan);
            // Check for index scan downgraded to sequential scan
            if (oldNodeType.includes('Index Scan') && !newNodeType.includes('Index Scan') && newNodeType.includes('Seq Scan')) {
                regressions.push({
                    type: 'plan_type_regression',
                    old_type: 'Index Scan',
                    new_type: 'Sequential Scan',
                    recommendation: 'Query plan has regressed from Index Scan to Sequential Scan. Check if indexes were dropped or statistics are outdated.'
                });
            }
            // Check for nested loop downgraded to hash join
            if (oldNodeType.includes('Nested Loop') && !newNodeType.includes('Nested Loop') && newNodeType.includes('Hash Join')) {
                regressions.push({
                    type: 'join_type_regression',
                    old_type: 'Nested Loop',
                    new_type: 'Hash Join',
                    recommendation: 'Join strategy has changed from Nested Loop to Hash Join. This might indicate missing indexes or outdated statistics.'
                });
            }
        }
        return regressions;
    }
    /**
     * Get all node types in a plan (for comparison)
     */
    getPlanNodeTypes(plan) {
        const types = [];
        if (plan['Node Type']) {
            types.push(plan['Node Type']);
        }
        if (plan.Plans) {
            for (const childPlan of plan.Plans) {
                types.push(...this.getPlanNodeTypes(childPlan));
            }
        }
        return types;
    }
    /**
     * Run a quick health check on both PostgreSQL and MongoDB databases
     * @returns Health check summary for both databases
     */
    async runHealthCheck() {
        try {
            logger_1.default.info('Running database health check');
            const result = {
                timestamp: new Date().toISOString(),
                postgres: { status: 'unknown', metrics: {} },
                mongodb: { status: 'unknown', metrics: {} }
            };
            // PostgreSQL health check
            try {
                // Test connection
                await this.prisma.$queryRaw `SELECT 1 as connection_test`;
                // Get basic metrics
                const pgMetrics = await this.prisma.$queryRaw `
          SELECT
            (SELECT count(*) FROM pg_stat_activity) as active_connections,
            pg_size_pretty(pg_database_size(current_database())) as database_size,
            (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
            (SELECT setting::integer FROM pg_settings WHERE name = 'max_connections') as max_connections
        `;
                // Check if any tables need vacuuming
                const vacuumNeeded = await this.prisma.$queryRaw `
          SELECT count(*) as tables_needing_vacuum
          FROM pg_stat_user_tables
          WHERE n_dead_tup > 10000 OR last_vacuum < NOW() - INTERVAL '1 week'
        `;
                result.postgres = {
                    status: 'connected',
                    metrics: {
                        ...pgMetrics[0],
                        tables_needing_vacuum: vacuumNeeded[0].tables_needing_vacuum,
                        connection_utilization: Math.round((pgMetrics[0].active_connections / pgMetrics[0].max_connections) * 100) + '%'
                    }
                };
            }
            catch (err) {
                result.postgres = {
                    status: 'error',
                    error: (err === null || err === void 0 ? void 0 : err.message) || String(err)
                };
            }
            // MongoDB health check
            if (mongoose_1.default.connection.db) {
                try {
                    const db = mongoose_1.default.connection.db;
                    // Test connection
                    await db.command({ ping: 1 });
                    // Get basic stats
                    const dbStats = await db.command({ dbStats: 1 });
                    // Get collection stats
                    const collections = await db.listCollections().toArray();
                    const collectionCount = collections.length;
                    // Get connection stats
                    const connStats = await db.command({ connectionStatus: 1 });
                    result.mongodb = {
                        status: 'connected',
                        metrics: {
                            database_size: this.formatBytes(dbStats.dataSize),
                            collection_count: collectionCount,
                            index_count: dbStats.indexes,
                            active_connections: dbStats.connections
                        }
                    };
                }
                catch (err) {
                    result.mongodb = {
                        status: 'error',
                        error: (err === null || err === void 0 ? void 0 : err.message) || String(err)
                    };
                }
            }
            else {
                result.mongodb = {
                    status: 'not_connected',
                    error: 'No active MongoDB connection'
                };
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Error running database health check: ' + ((error === null || error === void 0 ? void 0 : error.message) || error));
            throw error;
        }
    }
    /**
     * Format bytes to human-readable format
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}
exports.DatabaseOptimizationService = DatabaseOptimizationService;
// Use REDIS_URL from env or fallback
exports.databaseOptimizationService = new DatabaseOptimizationService(new client_1.PrismaClient(), process.env.REDIS_URL || 'redis://localhost:6379');
//# sourceMappingURL=databaseOptimization.service.js.map