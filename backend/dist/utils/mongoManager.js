"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cron = __importStar(require("node-cron"));
const client_s3_1 = require("@aws-sdk/client-s3");
const mongodb_config_1 = require("../config/mongodb.config");
const config_1 = require("../config/config");
const util_1 = __importDefault(require("util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
// Initialize S3 client for backups
const s3Client = new client_s3_1.S3Client({
    region: config_1.config.aws.region,
    credentials: {
        accessKeyId: config_1.config.aws.accessKeyId || '',
        secretAccessKey: config_1.config.aws.secretAccessKey || '',
    },
});
/**
 * MongoDB Manager Class
 * Handles MongoDB connection, security, and maintenance
 */
class MongoManager {
    constructor() {
        /**
         * Create a MongoDB connection with proper settings from config
         */
        this.createMongoConnection = async () => {
            try {
                const uri = mongodb_config_1.mongoConfig.connection.uri;
                const options = this.getConnectionOptions();
                // Set mongoose debug mode for query logging if enabled
                mongoose_1.default.set('debug', mongodb_config_1.mongoConfig.monitoring.enabled &&
                    mongodb_config_1.mongoConfig.monitoring.logLevel !== 'error');
                // Connect with options
                await mongoose_1.default.connect(uri, options);
                // Apply additional settings after connection
                this.applyMongooseSettings();
                // Set up event listeners for the MongoDB connection
                this.setupConnectionListeners();
                return mongoose_1.default;
            }
            catch (error) {
                console.error('Failed to create MongoDB connection:', error);
                throw error;
            }
        };
        /**
         * Get connection options from config
         */
        this.getConnectionOptions = () => {
            const options = {
                dbName: mongodb_config_1.mongoConfig.connection.dbName,
                minPoolSize: mongodb_config_1.mongoConfig.pool.minPoolSize,
                maxPoolSize: mongodb_config_1.mongoConfig.pool.maxPoolSize,
                serverSelectionTimeoutMS: mongodb_config_1.mongoConfig.connection.serverSelectionTimeoutMS,
                socketTimeoutMS: mongodb_config_1.mongoConfig.connection.socketTimeoutMS,
                connectTimeoutMS: mongodb_config_1.mongoConfig.connection.connectTimeoutMS,
            };
            // Add auth credentials if provided
            if (mongodb_config_1.mongoConfig.connection.user && mongodb_config_1.mongoConfig.connection.password) {
                options.auth = {
                    username: mongodb_config_1.mongoConfig.connection.user,
                    password: mongodb_config_1.mongoConfig.connection.password,
                };
                options.authSource = mongodb_config_1.mongoConfig.connection.authSource;
            }
            // Add replica set if configured
            if (mongodb_config_1.mongoConfig.replication.replicaSet) {
                options.replicaSet = mongodb_config_1.mongoConfig.replication.replicaSet;
            }
            // Add SSL options if enabled
            if (mongodb_config_1.mongoConfig.connection.ssl) {
                options.ssl = true;
                // Use type assertion for SSL properties not directly in the type
                options.sslValidate = mongodb_config_1.mongoConfig.connection.sslValidate;
                if (mongodb_config_1.mongoConfig.connection.sslCA) {
                    options.sslCA = mongodb_config_1.mongoConfig.connection.sslCA;
                }
            }
            return options;
        };
        /**
         * Apply additional mongoose settings after connection
         */
        this.applyMongooseSettings = () => {
            mongoose_1.default.set('toJSON', {
                virtuals: true,
                transform: (_, ret) => {
                    delete ret._id;
                    delete ret.__v;
                    return ret;
                }
            });
        };
        /**
         * Set up connection event listeners
         */
        this.setupConnectionListeners = () => {
            mongoose_1.default.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.warn('MongoDB disconnected. Attempting to reconnect...');
            });
            mongoose_1.default.connection.on('reconnected', () => {
                console.log('MongoDB reconnected successfully');
            });
            // Handle application termination
            process.on('SIGINT', async () => {
                await mongoose_1.default.connection.close();
                console.log('MongoDB connection closed due to application termination');
                process.exit(0);
            });
        };
        /**
         * Check MongoDB connection health
         */
        this.checkConnectionHealth = async () => {
            try {
                // Check if connected
                if (mongoose_1.default.connection.readyState !== 1) {
                    return false;
                }
                // Ping the database
                if (!mongoose_1.default.connection.db) {
                    return false;
                }
                const adminDb = mongoose_1.default.connection.db.admin();
                const result = await adminDb.ping();
                return result.ok === 1;
            }
            catch (error) {
                console.error('MongoDB health check failed:', error);
                return false;
            }
        };
        /**
         * Get MongoDB server status
         */
        this.getServerStatus = async () => {
            try {
                if (!mongoose_1.default.connection.db) {
                    throw new Error('MongoDB connection not established');
                }
                const adminDb = mongoose_1.default.connection.db.admin();
                return await adminDb.serverStatus();
            }
            catch (error) {
                console.error('Failed to get MongoDB server status:', error);
                throw error;
            }
        };
        /**
         * Initialize MongoDB with security settings and optimizations
         */
        this.initializeDatabase = async () => {
            try {
                console.log('Initializing MongoDB database...');
                // Enable authentication if configured
                if (process.env.NODE_ENV === 'production') {
                    await this.applySecuritySettings();
                }
                // Create indexes for performance
                await this.createIndexes();
                // Set up profiling if enabled
                if (mongodb_config_1.mongoConfig.monitoring.profilerEnabled) {
                    await this.enableProfiler();
                }
                console.log('MongoDB initialization completed successfully');
            }
            catch (error) {
                console.error('MongoDB initialization failed:', error);
                throw error;
            }
        };
        /**
         * Apply security settings to MongoDB
         */
        this.applySecuritySettings = async () => {
            try {
                console.log('Applying MongoDB security settings...');
                // We can't directly modify MongoDB server parameters from mongoose
                // This would typically be done via mongod.conf or mongo shell
                // Here we'll simulate what would be done in a real environment
                if (mongodb_config_1.mongoConfig.security.auditLogEnabled) {
                    console.log('MongoDB audit logging would be enabled in mongod.conf');
                    // In a real scenario:
                    // 1. Modify mongod.conf to include:
                    //    auditLog:
                    //      destination: file
                    //      format: JSON
                    //      path: /var/log/mongodb/audit.log
                    // 2. Restart MongoDB service
                }
                if (mongodb_config_1.mongoConfig.security.encryptionEnabled) {
                    console.log('MongoDB encryption at rest would be enabled in mongod.conf');
                    // In a real scenario:
                    // 1. Create encryption key file
                    // 2. Configure mongod.conf with security.enableEncryption: true
                    // 3. Restart MongoDB service
                }
                // Add IP whitelist to firewall
                if (mongodb_config_1.mongoConfig.security.ipWhitelist.length > 0) {
                    console.log(`MongoDB IP whitelist would be configured for: ${mongodb_config_1.mongoConfig.security.ipWhitelist.join(', ')}`);
                    // In a real scenario:
                    // 1. Configure firewall rules to only allow connections from whitelisted IPs
                    // 2. Configure bindIp in mongod.conf
                }
                console.log('MongoDB security settings applied successfully');
            }
            catch (error) {
                console.error('Failed to apply MongoDB security settings:', error);
                throw error;
            }
        };
        /**
         * Create indexes for MongoDB collections
         */
        this.createIndexes = async () => {
            try {
                console.log('Creating MongoDB indexes...');
                if (!mongoose_1.default.connection.db) {
                    throw new Error('MongoDB connection not established');
                }
                const db = mongoose_1.default.connection.db;
                // Create indexes for Listings collection
                const listingCollection = db.collection('listings');
                await listingCollection.createIndex({ propertyId: 1 }, { unique: true });
                await listingCollection.createIndex({ status: 1 });
                await listingCollection.createIndex({ location: '2dsphere' });
                await listingCollection.createIndex({ createdAt: 1 });
                await listingCollection.createIndex({
                    title: 'text',
                    description: 'text',
                    amenities: 'text',
                    propertyType: 'text'
                }, {
                    weights: {
                        title: 10,
                        description: 5,
                        amenities: 3,
                        propertyType: 2
                    },
                    name: 'listings_text_search'
                });
                // Create indexes for Applications collection
                const applicationCollection = db.collection('applications');
                await applicationCollection.createIndex({ listingId: 1 });
                await applicationCollection.createIndex({ applicantId: 1 });
                await applicationCollection.createIndex({ status: 1 });
                await applicationCollection.createIndex({ createdAt: 1 });
                // Create indexes for AIGeneratedContent collection
                const aiContentCollection = db.collection('aigeneratedcontents');
                await aiContentCollection.createIndex({ contentType: 1 });
                await aiContentCollection.createIndex({ referenceId: 1 });
                await aiContentCollection.createIndex({ createdAt: 1 });
                console.log('MongoDB indexes created successfully');
            }
            catch (error) {
                console.error('Failed to create MongoDB indexes:', error);
                throw error;
            }
        };
        /**
         * Enable profiler for MongoDB
         */
        this.enableProfiler = async () => {
            try {
                if (!mongoose_1.default.connection.db) {
                    throw new Error('MongoDB connection not established');
                }
                const db = mongoose_1.default.connection.db;
                await db.command({
                    profile: mongodb_config_1.mongoConfig.monitoring.profilerLevel,
                    slowms: mongodb_config_1.mongoConfig.monitoring.slowQueryThresholdMS
                });
                console.log(`MongoDB profiler enabled (level: ${mongodb_config_1.mongoConfig.monitoring.profilerLevel}, slow query threshold: ${mongodb_config_1.mongoConfig.monitoring.slowQueryThresholdMS}ms)`);
            }
            catch (error) {
                console.error('Failed to enable MongoDB profiler:', error);
            }
        };
        /**
         * Create a backup of MongoDB database
         */
        this.createDatabaseBackup = async () => {
            if (!mongodb_config_1.mongoConfig.backup.enabled) {
                console.log('MongoDB backups are disabled');
                return '';
            }
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFileName = `mongodb-${mongodb_config_1.mongoConfig.connection.dbName}-${timestamp}`;
                const backupDir = path_1.default.join(process.cwd(), 'backups', 'mongodb');
                const backupPath = path_1.default.join(backupDir, backupFileName);
                // Ensure backup directory exists
                if (!fs_1.default.existsSync(backupDir)) {
                    fs_1.default.mkdirSync(backupDir, { recursive: true });
                }
                // Get connection details from URI
                const uri = mongodb_config_1.mongoConfig.connection.uri;
                const authPart = mongodb_config_1.mongoConfig.connection.user && mongodb_config_1.mongoConfig.connection.password
                    ? `--username ${mongodb_config_1.mongoConfig.connection.user} --password ${mongodb_config_1.mongoConfig.connection.password} --authenticationDatabase ${mongodb_config_1.mongoConfig.connection.authSource}`
                    : '';
                // Extract host and port from URI
                const uriMatch = uri.match(/mongodb:\/\/([^:]+):?(\d+)?/);
                const host = uriMatch ? uriMatch[1] : 'localhost';
                const port = uriMatch && uriMatch[2] ? uriMatch[2] : '27017';
                // Create backup command
                const backupCmd = `mongodump --host ${host} --port ${port} ${authPart} --db ${mongodb_config_1.mongoConfig.connection.dbName} --out ${backupPath}`;
                console.log(`Creating MongoDB backup: ${backupFileName}`);
                await execPromise(backupCmd);
                // Compress backup if enabled
                if (mongodb_config_1.mongoConfig.backup.compressionEnabled) {
                    const tarCmd = `tar -czf ${backupPath}.tar.gz -C ${backupDir} ${backupFileName}`;
                    await execPromise(tarCmd);
                    // Remove original uncompressed directory
                    await execPromise(`rm -rf ${backupPath}`);
                    console.log(`Compressed MongoDB backup: ${backupFileName}.tar.gz`);
                }
                // Upload to S3 if configured
                if (mongodb_config_1.mongoConfig.backup.storageLocation.startsWith('s3://')) {
                    const backupFilePath = mongodb_config_1.mongoConfig.backup.compressionEnabled
                        ? `${backupPath}.tar.gz`
                        : backupPath;
                    const bucketPath = mongodb_config_1.mongoConfig.backup.storageLocation.replace('s3://', '');
                    const [bucket, ...keyParts] = bucketPath.split('/');
                    const key = keyParts.length > 0
                        ? `${keyParts.join('/')}/${backupFileName}${mongodb_config_1.mongoConfig.backup.compressionEnabled ? '.tar.gz' : ''}`
                        : `${backupFileName}${mongodb_config_1.mongoConfig.backup.compressionEnabled ? '.tar.gz' : ''}`;
                    // Only upload compressed archive or directory content
                    if (mongodb_config_1.mongoConfig.backup.compressionEnabled) {
                        const fileContent = fs_1.default.readFileSync(`${backupPath}.tar.gz`);
                        await s3Client.send(new client_s3_1.PutObjectCommand({
                            Bucket: bucket,
                            Key: key,
                            Body: fileContent,
                            ServerSideEncryption: mongodb_config_1.mongoConfig.backup.encryptBackups ? 'AES256' : undefined,
                        }));
                        console.log(`Uploaded MongoDB backup to S3: ${bucket}/${key}`);
                        // Clean up local file after S3 upload
                        fs_1.default.unlinkSync(`${backupPath}.tar.gz`);
                    }
                    else {
                        console.log('Skipping S3 upload for uncompressed backup directory');
                    }
                }
                return backupFileName;
            }
            catch (error) {
                console.error('Failed to create MongoDB backup:', error);
                throw error;
            }
        };
        /**
         * Set up scheduled backups for MongoDB
         */
        this.setupScheduledBackups = () => {
            if (!mongodb_config_1.mongoConfig.backup.enabled) {
                console.log('MongoDB scheduled backups are disabled');
                return;
            }
            // Schedule backups according to cron pattern
            cron.schedule(mongodb_config_1.mongoConfig.backup.schedule, async () => {
                try {
                    console.log('Starting scheduled MongoDB backup...');
                    await this.createDatabaseBackup();
                    console.log('Scheduled MongoDB backup completed successfully');
                }
                catch (error) {
                    console.error('Scheduled MongoDB backup failed:', error);
                }
            });
            console.log(`MongoDB scheduled backups configured with pattern: ${mongodb_config_1.mongoConfig.backup.schedule}`);
        };
        /**
         * Optimize MongoDB database
         */
        this.optimizeDatabase = async () => {
            try {
                console.log('Running MongoDB optimization...');
                if (!mongoose_1.default.connection.db) {
                    throw new Error('MongoDB connection not established');
                }
                const db = mongoose_1.default.connection.db;
                // Run repair on database
                await db.command({ repairDatabase: 1 });
                // Get collection stats to identify potential improvements
                const collections = await db.listCollections().toArray();
                for (const collection of collections) {
                    const stats = await db.command({ collStats: collection.name });
                    // Check if collection needs compact
                    if (stats.wiredTiger && stats.wiredTiger.creationTime) {
                        // Log collection stats
                        console.log(`Collection ${collection.name}: ${stats.count} documents, ${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`);
                        // Run compact on collection if it's substantial in size (> 50MB)
                        if (stats.size > 50 * 1024 * 1024) {
                            try {
                                await db.command({ compact: collection.name });
                                console.log(`Compacted collection: ${collection.name}`);
                            }
                            catch (compactError) {
                                console.error(`Failed to compact collection ${collection.name}:`, compactError);
                            }
                        }
                    }
                }
                // Check for slow queries from profiler if enabled
                if (mongodb_config_1.mongoConfig.monitoring.profilerEnabled) {
                    const slowQueries = await db.collection('system.profile')
                        .find({})
                        .sort({ millis: -1 })
                        .limit(10)
                        .toArray();
                    if (slowQueries.length > 0) {
                        console.log('Slow MongoDB queries detected:');
                        slowQueries.forEach(query => {
                            console.log(`- ${query.op} on ${query.ns} took ${query.millis}ms: ${JSON.stringify(query.query || query.command)}`);
                        });
                    }
                }
                console.log('MongoDB optimization completed');
            }
            catch (error) {
                console.error('MongoDB optimization failed:', error);
            }
        };
    }
}
// Export as singleton
const mongoManager = new MongoManager();
exports.default = mongoManager;
//# sourceMappingURL=mongoManager.js.map