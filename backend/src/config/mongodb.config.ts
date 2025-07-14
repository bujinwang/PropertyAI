import dotenv from 'dotenv';

// Initialize dotenv to load environment variables from .env file
dotenv.config();

// MongoDB connection configuration
export const mongoConfig = {
  // Connection parameters
  connection: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/propertyai',
    dbName: process.env.MONGODB_DB_NAME || 'propertyai',
    // Authentication options
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
    authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
    // Connection options
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '30000'),
    connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '10000'),
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
    // TLS/SSL settings
    ssl: process.env.MONGODB_SSL === 'true',
    sslValidate: process.env.MONGODB_SSL_VALIDATE === 'true',
    sslCA: process.env.MONGODB_SSL_CA || undefined,
    sslCert: process.env.MONGODB_SSL_CERT || undefined,
    sslKey: process.env.MONGODB_SSL_KEY || undefined,
  },
  
  // Replica set and sharding settings
  replication: {
    replicaSet: process.env.MONGODB_REPLICA_SET || undefined,
    readPreference: process.env.MONGODB_READ_PREFERENCE || 'primary',
    w: process.env.MONGODB_WRITE_CONCERN || 'majority',
    wtimeoutMS: parseInt(process.env.MONGODB_WRITE_TIMEOUT || '5000'),
  },
  
  // Connection pool settings
  pool: {
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5'),
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50'),
    maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '30000'),
  },
  
  // Security settings
  security: {
    encryptionEnabled: process.env.MONGODB_ENCRYPTION_ENABLED === 'true',
    clientEncryption: process.env.MONGODB_CLIENT_ENCRYPTION === 'true',
    encryptionKeyFile: process.env.MONGODB_ENCRYPTION_KEY_FILE || './mongodb-keyfile',
    auditLogEnabled: process.env.MONGODB_AUDIT_LOG === 'true',
    ipWhitelist: process.env.MONGODB_IP_WHITELIST ? process.env.MONGODB_IP_WHITELIST.split(',') : [],
  },
  
  // Backup configuration
  backup: {
    enabled: process.env.MONGODB_BACKUP_ENABLED === 'true',
    schedule: process.env.MONGODB_BACKUP_SCHEDULE || '0 0 * * *', // Default: daily at midnight (cron format)
    retentionPeriodDays: parseInt(process.env.MONGODB_BACKUP_RETENTION_DAYS || '30'),
    storageLocation: process.env.MONGODB_BACKUP_STORAGE || 's3://propertyai-backups/mongodb',
    compressionEnabled: process.env.MONGODB_BACKUP_COMPRESSION === 'true',
    encryptBackups: process.env.MONGODB_BACKUP_ENCRYPTION === 'true',
  },
  
  // Performance monitoring
  monitoring: {
    enabled: process.env.MONGODB_MONITORING_ENABLED === 'true',
    slowQueryThresholdMS: parseInt(process.env.MONGODB_SLOW_QUERY_MS || '100'),
    logLevel: process.env.MONGODB_LOG_LEVEL || 'error',
    profilerEnabled: process.env.MONGODB_PROFILER_ENABLED === 'true',
    profilerLevel: parseInt(process.env.MONGODB_PROFILER_LEVEL || '1'), // 0=off, 1=slow, 2=all
  }
};

// Build the connection options from config
export const getMongoConnectionOptions = () => {
  const options: any = {
    dbName: mongoConfig.connection.dbName,
    // Connection pool settings
    minPoolSize: mongoConfig.pool.minPoolSize,
    maxPoolSize: mongoConfig.pool.maxPoolSize,
    maxIdleTimeMS: mongoConfig.pool.maxIdleTimeMS,
    // Timeouts
    serverSelectionTimeoutMS: mongoConfig.connection.serverSelectionTimeoutMS,
    connectTimeoutMS: mongoConfig.connection.connectTimeoutMS,
    socketTimeoutMS: mongoConfig.connection.socketTimeoutMS,
    // Replication settings
    readPreference: mongoConfig.replication.readPreference,
    w: mongoConfig.replication.w,
    wtimeoutMS: mongoConfig.replication.wtimeoutMS,
  };

  // Add replica set if defined
  if (mongoConfig.replication.replicaSet) {
    options.replicaSet = mongoConfig.replication.replicaSet;
  }

  // Add SSL/TLS options if enabled
  if (mongoConfig.connection.ssl) {
    options.ssl = true;
    options.sslValidate = mongoConfig.connection.sslValidate;
    
    if (mongoConfig.connection.sslCA) {
      options.sslCA = mongoConfig.connection.sslCA;
    }
    
    if (mongoConfig.connection.sslCert) {
      options.sslCert = mongoConfig.connection.sslCert;
    }
    
    if (mongoConfig.connection.sslKey) {
      options.sslKey = mongoConfig.connection.sslKey;
    }
  }

  return options;
};

// Generate MongoDB user creation commands
export const getMongoUserCreationCommands = (): string[] => {
  return [
    // Admin user (full access)
    `db.createUser({
      user: "${process.env.MONGODB_ADMIN_USER || 'propertyai_admin'}",
      pwd: "${process.env.MONGODB_ADMIN_PASSWORD || 'admin_password'}",
      roles: [{ role: "userAdminAnyDatabase", db: "admin" }, { role: "dbAdminAnyDatabase", db: "admin" }, { role: "readWriteAnyDatabase", db: "admin" }]
    })`,
    
    // Application user (read/write to specific database)
    `use ${mongoConfig.connection.dbName}
    db.createUser({
      user: "${process.env.MONGODB_APP_USER || 'propertyai_app'}",
      pwd: "${process.env.MONGODB_APP_PASSWORD || 'app_password'}",
      roles: [{ role: "readWrite", db: "${mongoConfig.connection.dbName}" }]
    })`,
    
    // Read-only user
    `use ${mongoConfig.connection.dbName}
    db.createUser({
      user: "${process.env.MONGODB_READONLY_USER || 'propertyai_readonly'}",
      pwd: "${process.env.MONGODB_READONLY_PASSWORD || 'readonly_password'}",
      roles: [{ role: "read", db: "${mongoConfig.connection.dbName}" }]
    })`
  ];
};

// Generate MongoDB replica set configuration command
export const getReplicaSetConfig = (): string => {
  return `
rs.initiate({
  _id: "${mongoConfig.replication.replicaSet || 'propertyai_rs'}",
  members: [
    { _id: 0, host: "localhost:27017", priority: 2 },
    { _id: 1, host: "localhost:27018", priority: 1 },
    { _id: 2, host: "localhost:27019", priority: 1, arbiterOnly: true }
  ]
})
  `;
}; 