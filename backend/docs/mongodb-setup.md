# MongoDB Setup and Configuration Guide

This guide outlines the steps to set up, configure, and secure MongoDB for the PropertyAI application.

## Table of Contents

1. [Installation](#installation)
2. [Basic Configuration](#basic-configuration)
3. [Security Configuration](#security-configuration)
4. [Replica Set Setup](#replica-set-setup)
5. [Performance Optimization](#performance-optimization)
6. [Backups](#backups)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Installation

### Local Development Environment

1. **Install MongoDB Community Edition**:
   - [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Choose the version appropriate for your OS

2. **Start MongoDB service**:
   - Linux: `sudo systemctl start mongod`
   - macOS (with Homebrew): `brew services start mongodb-community`
   - Windows: Start the MongoDB service from Services

3. **Verify Installation**:
   ```bash
   mongosh
   ```

### Production Environment

For production, we recommend using either:

1. **MongoDB Atlas** (recommended cloud solution):
   - Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Set up a new cluster
   - Configure network access and database users
   - Obtain the connection string

2. **Self-hosted MongoDB**:
   - Set up on Linux server (preferably Ubuntu/RHEL)
   - Follow the [official installation guide](https://docs.mongodb.com/manual/administration/install-on-linux/)
   - Configure as a systemd service for automatic startup

## Basic Configuration

### Environment Variables

Configure MongoDB connection parameters in your `.env` file based on the example provided in `database.env.example`:

```
# MongoDB Connection Parameters
MONGODB_URI=mongodb://localhost:27017/propertyai
MONGODB_DB_NAME=propertyai
MONGODB_USER=your_username
MONGODB_PASSWORD=your_password
MONGODB_AUTH_SOURCE=admin
```

For a complete list of configuration options, refer to the `database.env.example` file.

### Connection Options

The application uses the following connection options by default:

- Connection timeout: 10 seconds
- Socket timeout: 45 seconds
- Server selection timeout: 30 seconds
- Min pool size: 5 connections
- Max pool size: 50 connections

These can be adjusted in the `.env` file as needed for your specific environment.

## Security Configuration

### Authentication

1. **Enable authentication** in MongoDB:

   Add to your `mongod.conf`:
   ```yaml
   security:
     authorization: enabled
   ```

2. **Create administrative user**:
   ```javascript
   use admin
   db.createUser({
     user: "propertyai_admin",
     pwd: "secure_password",
     roles: [{ role: "userAdminAnyDatabase", db: "admin" }, 
             { role: "dbAdminAnyDatabase", db: "admin" }, 
             { role: "readWriteAnyDatabase", db: "admin" }]
   })
   ```

3. **Create application users**:
   ```javascript
   use propertyai
   db.createUser({
     user: "propertyai_app",
     pwd: "app_password",
     roles: [{ role: "readWrite", db: "propertyai" }]
   })

   db.createUser({
     user: "propertyai_readonly",
     pwd: "readonly_password",
     roles: [{ role: "read", db: "propertyai" }]
   })
   ```

### Network Security

1. **Firewall Configuration**:
   - Restrict MongoDB port (default 27017) to only allow connections from application servers
   - Use iptables, ufw, or cloud provider security groups

2. **Bind to specific IP**:
   
   Add to your `mongod.conf`:
   ```yaml
   net:
     bindIp: 127.0.0.1,your_server_ip
   ```

### Encryption

1. **Transport Encryption (TLS/SSL)**:

   Add to your `mongod.conf`:
   ```yaml
   net:
     tls:
       mode: requireTLS
       certificateKeyFile: /path/to/mongodb.pem
       CAFile: /path/to/ca.pem
   ```

2. **Encryption at Rest**:
   - For MongoDB Enterprise: Use the WiredTiger storage engine's encryption option
   - For MongoDB Community: Use filesystem-level encryption (like dm-crypt on Linux)

## Replica Set Setup

For high availability, set up a replica set with at least 3 nodes:

1. **Configure each member** with a unique `mongod.conf`:
   ```yaml
   replication:
     replSetName: propertyai_rs
   ```

2. **Initialize the replica set** from the primary node:
   ```javascript
   rs.initiate({
     _id: "propertyai_rs",
     members: [
       { _id: 0, host: "mongodb-01:27017", priority: 2 },
       { _id: 1, host: "mongodb-02:27017", priority: 1 },
       { _id: 2, host: "mongodb-03:27017", priority: 1 }
     ]
   })
   ```

3. **Check replica set status**:
   ```javascript
   rs.status()
   ```

4. **Update connection string** in `.env`:
   ```
   MONGODB_URI=mongodb://user:pass@mongodb-01:27017,mongodb-02:27017,mongodb-03:27017/propertyai?replicaSet=propertyai_rs
   MONGODB_REPLICA_SET=propertyai_rs
   ```

## Performance Optimization

### Indexes

The application automatically creates the following indexes:

1. **Listings Collection**:
   - `propertyId` (unique)
   - `status`
   - `location` (2dsphere for geospatial queries)
   - `createdAt`
   - Text search index on `title`, `description`, `amenities`, and `propertyType`

2. **Applications Collection**:
   - `listingId`
   - `applicantId`
   - `status`
   - `createdAt`

3. **AIGeneratedContent Collection**:
   - `contentType`
   - `referenceId`
   - `createdAt`

### WiredTiger Configuration

For production systems, consider tuning WiredTiger cache:

Add to your `mongod.conf`:
```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2  # Adjust based on available RAM (usually 50% of RAM)
```

### Query Optimization

1. **Enable profiling** in production to identify slow queries:
   ```
   MONGODB_PROFILER_ENABLED=true
   MONGODB_PROFILER_LEVEL=1
   MONGODB_SLOW_QUERY_MS=100
   ```

2. **Analyze slow queries** periodically:
   ```javascript
   use propertyai
   db.system.profile.find({millis: {$gt: 100}}).sort({ts: -1})
   ```

## Backups

The application includes an automated backup system:

1. **Configure backups** in `.env`:
   ```
   MONGODB_BACKUP_ENABLED=true
   MONGODB_BACKUP_SCHEDULE=0 0 * * *  # Daily at midnight (cron format)
   MONGODB_BACKUP_COMPRESSION=true
   ```

2. **S3 Storage** for backups:
   ```
   MONGODB_BACKUP_STORAGE=s3://your-bucket/mongodb-backups
   ```
   Ensure AWS credentials are configured in the main application config.

3. **Manual backup** command:
   ```bash
   mongodump --uri="mongodb://user:pass@host:port/propertyai" --out=/path/to/backup
   ```

4. **Restore from backup**:
   ```bash
   mongorestore --uri="mongodb://user:pass@host:port/propertyai" /path/to/backup
   ```

## Monitoring

1. **Enable monitoring** in `.env`:
   ```
   MONGODB_MONITORING_ENABLED=true
   ```

2. **Integration with monitoring tools**:
   - MongoDB Atlas provides built-in monitoring
   - For self-hosted: Consider MongoDB Cloud Manager, Prometheus with MongoDB exporter, or DataDog

3. **Key metrics to monitor**:
   - Query performance
   - Connection count
   - Operation latency
   - Memory usage
   - Disk I/O
   - Replication lag

## Troubleshooting

### Common Issues

1. **Connection failures**:
   - Verify network connectivity
   - Check authentication credentials
   - Ensure IP is allowed in firewall/security groups
   - Verify MongoDB service is running

2. **Performance issues**:
   - Check for missing indexes
   - Review slow query log
   - Analyze server resource utilization
   - Check for locks and contention

3. **Replica set issues**:
   - Verify all members are reachable
   - Check replication lag
   - Review oplog size

### Diagnostic Commands

```javascript
// Check server status
db.serverStatus()

// Check database stats
db.stats()

// Check collection stats
db.listings.stats()

// View current operations
db.currentOp()

// Kill a long-running operation
db.killOp(opId)
```

For additional support, refer to [MongoDB Documentation](https://docs.mongodb.com/) or contact the development team. 