# PropertyAI Database Setup and Management

This document provides guidelines and best practices for setting up, configuring, and managing the PropertyAI database infrastructure, which uses PostgreSQL for structured data and MongoDB for document storage.

## PostgreSQL Setup

### Connection Configuration

PostgreSQL connection parameters are configured in the `.env` file. You can find a template in `src/config/database.env.example`. The most important settings are:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/propertyai
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=propertyai
PG_USER=postgres
PG_PASSWORD=postgres
```

For security in production, ensure that:
1. Database passwords are strong and unique
2. Consider enabling SSL with `PG_SSL=true`
3. Restrict IP access using `PG_IP_WHITELIST`

### Database Initialization

The application will automatically initialize the database with appropriate settings when it starts. This includes:

1. Setting up required extensions (uuid-ossp, pg_stat_statements, pgcrypto)
2. Configuring performance parameters for PostgreSQL
3. Applying security settings (if in production mode)

### Security Hardening

For production deployments, additional security measures are applied:

1. **User Roles and Privileges**
   - `propertyai_admin`: Full access to database (use only for maintenance)
   - `propertyai_app`: Regular application access with write privileges
   - `propertyai_readonly`: Read-only access for reporting

2. **Security Settings**
   - Query timeouts to prevent long-running queries
   - Connection limits in production
   - Audit logging for data modifications
   - Statement timeouts

3. **Data Protection**
   - Option for data-at-rest encryption
   - TLS/SSL for data-in-transit

### Backup and Recovery

The application supports automated backups:

1. Enable backups with `PG_BACKUP_ENABLED=true`
2. Configure schedule using cron format (`PG_BACKUP_SCHEDULE`)
3. Set retention period in days (`PG_BACKUP_RETENTION_DAYS`)
4. Configure storage location (local or S3)

Backups can be compressed and encrypted for additional security.

### Performance Optimization

The application includes tools for monitoring and optimizing database performance:

1. Slow query tracking
2. Index usage analysis
3. Automatic VACUUM ANALYZE to maintain statistics
4. Connection pooling configuration

## MongoDB Setup

MongoDB is used for document-based storage, including:

1. Property listings
2. Tenant applications
3. AI-generated content
4. Messages and maintenance records
5. Property analytics

### Connection Configuration

MongoDB connection is configured via the `MONGODB_URI` environment variable:

```
MONGODB_URI=mongodb://localhost:27017/propertyai
```

## Database Schema

The PostgreSQL schema is managed through Prisma migrations. Key models include:

- User
- Property
- Unit
- Lease
- MaintenanceRequest
- Document
- Transaction

MongoDB collections are defined in `src/models/mongoModels.ts` and include:

- Listings
- Applications
- AIGeneratedContent
- Messages
- MaintenanceRecords
- CommunicationTemplates
- ChatbotConversations
- PropertyAnalytics

## Maintenance Tasks

Regular maintenance tasks include:

1. Reviewing slow queries
2. Checking for missing indexes
3. Monitoring backup status
4. Reviewing security settings

## Development Environment

For local development:

1. Install PostgreSQL and MongoDB
2. Copy `src/config/database.env.example` to `.env` and update as needed
3. Run Prisma migrations: `npm run prisma:migrate`
4. Start the server: `npm run dev`

## Troubleshooting

Common issues and solutions:

1. **Connection failures**: Check host, port, credentials, and firewall settings
2. **Performance issues**: Look for slow queries, missing indexes, or insufficient resources
3. **Backup failures**: Verify storage permissions and space availability

For database-related issues, check logs at startup and during operation. 