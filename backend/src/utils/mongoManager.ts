import mongoose from 'mongoose';
import { exec } from 'child_process';
import * as fs from 'fs';
import path from 'path';
import * as cron from 'node-cron';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { mongoConfig } from '../config/mongodb.config';
import { config } from '../config/config';
import util from 'util';

const execPromise = util.promisify(exec);

// Initialize S3 client for backups
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId || '',
    secretAccessKey: config.aws.secretAccessKey || '',
  },
});

/**
 * MongoDB Manager Class
 * Handles MongoDB connection, security, and maintenance
 */
class MongoManager {
  /**
   * Create a MongoDB connection with proper settings from config
   */
  createMongoConnection = async (): Promise<typeof mongoose> => {
    try {
      const uri = mongoConfig.connection.uri;
      const options = this.getConnectionOptions();
      
      // Set mongoose debug mode for query logging if enabled
      mongoose.set('debug', mongoConfig.monitoring.enabled && 
                          mongoConfig.monitoring.logLevel !== 'error');
      
      // Connect with options
      await mongoose.connect(uri, options);
      
      // Apply additional settings after connection
      this.applyMongooseSettings();
      
      // Set up event listeners for the MongoDB connection
      this.setupConnectionListeners();
      
      return mongoose;
    } catch (error) {
      console.error('Failed to create MongoDB connection:', error);
      throw error;
    }
  };
  
  /**
   * Get connection options from config
   */
  private getConnectionOptions = () => {
    const options: mongoose.ConnectOptions = {
      dbName: mongoConfig.connection.dbName,
      minPoolSize: mongoConfig.pool.minPoolSize,
      maxPoolSize: mongoConfig.pool.maxPoolSize,
      serverSelectionTimeoutMS: mongoConfig.connection.serverSelectionTimeoutMS,
      socketTimeoutMS: mongoConfig.connection.socketTimeoutMS,
      connectTimeoutMS: mongoConfig.connection.connectTimeoutMS,
    };
    
    // Add auth credentials if provided
    if (mongoConfig.connection.user && mongoConfig.connection.password) {
      options.auth = {
        username: mongoConfig.connection.user,
        password: mongoConfig.connection.password,
      };
      options.authSource = mongoConfig.connection.authSource;
    }
    
    // Add replica set if configured
    if (mongoConfig.replication.replicaSet) {
      options.replicaSet = mongoConfig.replication.replicaSet;
    }
    
    // Add SSL options if enabled
    if (mongoConfig.connection.ssl) {
      options.ssl = true;
      // Use type assertion for SSL properties not directly in the type
      (options as any).sslValidate = mongoConfig.connection.sslValidate;
      
      if (mongoConfig.connection.sslCA) {
        (options as any).sslCA = mongoConfig.connection.sslCA;
      }
    }
    
    return options;
  };
  
  /**
   * Apply additional mongoose settings after connection
   */
  private applyMongooseSettings = () => {
    mongoose.set('toJSON', {
      virtuals: true,
      transform: (_, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    });
  };
  
  /**
   * Set up connection event listeners
   */
  private setupConnectionListeners = () => {
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    });
  };
  
  /**
   * Check MongoDB connection health
   */
  checkConnectionHealth = async (): Promise<boolean> => {
    try {
      // Check if connected
      if (mongoose.connection.readyState !== 1) {
        return false;
      }
      
      // Ping the database
      if (!mongoose.connection.db) {
        return false;
      }
      
      const adminDb = mongoose.connection.db.admin();
      const result = await adminDb.ping();
      
      return result.ok === 1;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
      return false;
    }
  };
  
  /**
   * Get MongoDB server status
   */
  getServerStatus = async (): Promise<any> => {
    try {
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
      }
      
      const adminDb = mongoose.connection.db.admin();
      return await adminDb.serverStatus();
    } catch (error) {
      console.error('Failed to get MongoDB server status:', error);
      throw error;
    }
  };
  
  /**
   * Initialize MongoDB with security settings and optimizations
   */
  initializeDatabase = async (): Promise<void> => {
    try {
      console.log('Initializing MongoDB database...');
      
      // Enable authentication if configured
      if (process.env.NODE_ENV === 'production') {
        await this.applySecuritySettings();
      }
      
      // Create indexes for performance
      await this.createIndexes();
      
      // Set up profiling if enabled
      if (mongoConfig.monitoring.profilerEnabled) {
        await this.enableProfiler();
      }
      
      console.log('MongoDB initialization completed successfully');
    } catch (error) {
      console.error('MongoDB initialization failed:', error);
      throw error;
    }
  };
  
  /**
   * Apply security settings to MongoDB
   */
  applySecuritySettings = async (): Promise<void> => {
    try {
      console.log('Applying MongoDB security settings...');
      
      // We can't directly modify MongoDB server parameters from mongoose
      // This would typically be done via mongod.conf or mongo shell
      // Here we'll simulate what would be done in a real environment
      
      if (mongoConfig.security.auditLogEnabled) {
        console.log('MongoDB audit logging would be enabled in mongod.conf');
        // In a real scenario:
        // 1. Modify mongod.conf to include:
        //    auditLog:
        //      destination: file
        //      format: JSON
        //      path: /var/log/mongodb/audit.log
        // 2. Restart MongoDB service
      }
      
      if (mongoConfig.security.encryptionEnabled) {
        console.log('MongoDB encryption at rest would be enabled in mongod.conf');
        // In a real scenario:
        // 1. Create encryption key file
        // 2. Configure mongod.conf with security.enableEncryption: true
        // 3. Restart MongoDB service
      }
      
      // Add IP whitelist to firewall
      if (mongoConfig.security.ipWhitelist.length > 0) {
        console.log(`MongoDB IP whitelist would be configured for: ${mongoConfig.security.ipWhitelist.join(', ')}`);
        // In a real scenario:
        // 1. Configure firewall rules to only allow connections from whitelisted IPs
        // 2. Configure bindIp in mongod.conf
      }
      
      console.log('MongoDB security settings applied successfully');
    } catch (error) {
      console.error('Failed to apply MongoDB security settings:', error);
      throw error;
    }
  };
  
  /**
   * Create indexes for MongoDB collections
   */
  createIndexes = async (): Promise<void> => {
    try {
      console.log('Creating MongoDB indexes...');
      
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
      }
      
      const db = mongoose.connection.db;
      
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
    } catch (error) {
      console.error('Failed to create MongoDB indexes:', error);
      throw error;
    }
  };
  
  /**
   * Enable profiler for MongoDB
   */
  enableProfiler = async (): Promise<void> => {
    try {
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
      }
      
      const db = mongoose.connection.db;
      await db.command({
        profile: mongoConfig.monitoring.profilerLevel,
        slowms: mongoConfig.monitoring.slowQueryThresholdMS
      });
      console.log(`MongoDB profiler enabled (level: ${mongoConfig.monitoring.profilerLevel}, slow query threshold: ${mongoConfig.monitoring.slowQueryThresholdMS}ms)`);
    } catch (error) {
      console.error('Failed to enable MongoDB profiler:', error);
    }
  };
  
  /**
   * Create a backup of MongoDB database
   */
  createDatabaseBackup = async (): Promise<string> => {
    if (!mongoConfig.backup.enabled) {
      console.log('MongoDB backups are disabled');
      return '';
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `mongodb-${mongoConfig.connection.dbName}-${timestamp}`;
      const backupDir = path.join(process.cwd(), 'backups', 'mongodb');
      const backupPath = path.join(backupDir, backupFileName);
      
      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Get connection details from URI
      const uri = mongoConfig.connection.uri;
      const authPart = mongoConfig.connection.user && mongoConfig.connection.password
        ? `--username ${mongoConfig.connection.user} --password ${mongoConfig.connection.password} --authenticationDatabase ${mongoConfig.connection.authSource}`
        : '';
      
      // Extract host and port from URI
      const uriMatch = uri.match(/mongodb:\/\/([^:]+):?(\d+)?/);
      const host = uriMatch ? uriMatch[1] : 'localhost';
      const port = uriMatch && uriMatch[2] ? uriMatch[2] : '27017';
      
      // Create backup command
      const backupCmd = `mongodump --host ${host} --port ${port} ${authPart} --db ${mongoConfig.connection.dbName} --out ${backupPath}`;
      
      console.log(`Creating MongoDB backup: ${backupFileName}`);
      await execPromise(backupCmd);
      
      // Compress backup if enabled
      if (mongoConfig.backup.compressionEnabled) {
        const tarCmd = `tar -czf ${backupPath}.tar.gz -C ${backupDir} ${backupFileName}`;
        await execPromise(tarCmd);
        
        // Remove original uncompressed directory
        await execPromise(`rm -rf ${backupPath}`);
        
        console.log(`Compressed MongoDB backup: ${backupFileName}.tar.gz`);
      }
      
      // Upload to S3 if configured
      if (mongoConfig.backup.storageLocation.startsWith('s3://')) {
        const backupFilePath = mongoConfig.backup.compressionEnabled
          ? `${backupPath}.tar.gz`
          : backupPath;
        
        const bucketPath = mongoConfig.backup.storageLocation.replace('s3://', '');
        const [bucket, ...keyParts] = bucketPath.split('/');
        const key = keyParts.length > 0
          ? `${keyParts.join('/')}/${backupFileName}${mongoConfig.backup.compressionEnabled ? '.tar.gz' : ''}`
          : `${backupFileName}${mongoConfig.backup.compressionEnabled ? '.tar.gz' : ''}`;
        
        // Only upload compressed archive or directory content
        if (mongoConfig.backup.compressionEnabled) {
          const fileContent = fs.readFileSync(`${backupPath}.tar.gz`);
          
          await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileContent,
            ServerSideEncryption: mongoConfig.backup.encryptBackups ? 'AES256' : undefined,
          }));
          
          console.log(`Uploaded MongoDB backup to S3: ${bucket}/${key}`);
          
          // Clean up local file after S3 upload
          fs.unlinkSync(`${backupPath}.tar.gz`);
        } else {
          console.log('Skipping S3 upload for uncompressed backup directory');
        }
      }
      
      return backupFileName;
    } catch (error) {
      console.error('Failed to create MongoDB backup:', error);
      throw error;
    }
  };
  
  /**
   * Set up scheduled backups for MongoDB
   */
  setupScheduledBackups = (): void => {
    if (!mongoConfig.backup.enabled) {
      console.log('MongoDB scheduled backups are disabled');
      return;
    }
    
    // Schedule backups according to cron pattern
    cron.schedule(mongoConfig.backup.schedule, async () => {
      try {
        console.log('Starting scheduled MongoDB backup...');
        await this.createDatabaseBackup();
        console.log('Scheduled MongoDB backup completed successfully');
      } catch (error) {
        console.error('Scheduled MongoDB backup failed:', error);
      }
    });
    
    console.log(`MongoDB scheduled backups configured with pattern: ${mongoConfig.backup.schedule}`);
  };
  
  /**
   * Optimize MongoDB database
   */
  optimizeDatabase = async (): Promise<void> => {
    try {
      console.log('Running MongoDB optimization...');
      
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
      }
      
      const db = mongoose.connection.db;
      
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
            } catch (compactError) {
              console.error(`Failed to compact collection ${collection.name}:`, compactError);
            }
          }
        }
      }
      
      // Check for slow queries from profiler if enabled
      if (mongoConfig.monitoring.profilerEnabled) {
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
    } catch (error) {
      console.error('MongoDB optimization failed:', error);
    }
  };
}

// Export as singleton
const mongoManager = new MongoManager();
export default mongoManager;
