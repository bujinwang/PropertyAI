# 🚀 Sequelize to Prisma Migration Guide

## Overview

This guide provides step-by-step instructions for migrating your data from Sequelize to Prisma. The migration process is designed to be safe, with automatic backups and rollback capabilities.

## ⚠️ Important Prerequisites

### Environment Setup

1. **Create `.env` file** with the following variables:
```bash
# Sequelize Database (Source)
SEQUELIZE_DB_HOST=localhost
SEQUELIZE_DB_PORT=5432
SEQUELIZE_DB_NAME=propertyai_sequelize
SEQUELIZE_DB_USER=postgres
SEQUELIZE_DB_PASSWORD=your_password

# Prisma Database (Target)
DATABASE_URL="postgresql://user:pass@localhost:5432/propertyai_prisma"
```

2. **Ensure databases exist**:
   - Source database (`propertyai_sequelize`) should contain your current data
   - Target database (`propertyai_prisma`) should be empty or contain only schema

3. **Install dependencies**:
```bash
npm install @prisma/client sequelize dotenv
```

## 🚀 Migration Process

### Step 1: Pre-Migration Checklist

- [ ] Backup your production database
- [ ] Test migration in staging environment first
- [ ] Ensure all services are migrated to Prisma (see main migration guide)
- [ ] Verify environment variables are set correctly
- [ ] Stop all application services during migration

### Step 2: Run Migration

```bash
# Navigate to backend directory
cd backend

# Run the migration tool
node migrate.js
```

Select option **1** to run the full migration.

### Step 3: Monitor Migration Progress

The migration will:
1. ✅ Connect to both databases
2. 📦 Create automatic backup
3. 👥 Migrate tenants
4. 🏠 Migrate properties
5. 📄 Migrate invoices
6. 💳 Migrate payments
7. 🔧 Migrate maintenance history
8. 🔍 Validate migration results

### Step 4: Post-Migration Validation

After migration completes:
1. Check the generated `migration-report.json` for results
2. Verify data integrity using option **4** (Validate Current Data)
3. Test your application with migrated data
4. Update your application configuration to use Prisma

## 🔄 Rollback Process

If you need to rollback the migration:

```bash
# Run the migration tool
node migrate.js

# Select option 2 (Rollback Migration)
```

The rollback will:
1. Clear migrated data from Prisma
2. Restore data from backup
3. Validate rollback integrity

## 📊 Monitoring & Troubleshooting

### Check Migration Status

```bash
node migrate.js
# Select option 3 (Check Migration Status)
```

### View Detailed Reports

- `migration-report.json` - Complete migration results
- `rollback-report.json` - Rollback results (if performed)
- `./backups/migration_backup.json` - Data backup

### Common Issues

#### Connection Errors
```
Error: Sequelize connection failed
```
**Solution**: Check your `SEQUELIZE_DB_*` environment variables

#### Prisma Connection Errors
```
Error: P1001: Can't reach database server
```
**Solution**: Verify `DATABASE_URL` is correct and database is accessible

#### Data Validation Failures
```
❌ tenants: Sequelize=100, Prisma=95
```
**Solution**: Check migration logs for specific failed records

## 📋 Migration Scripts

### Manual Migration (Advanced Users)

If you prefer to run migration scripts directly:

```bash
# Run migration
node scripts/migrate-sequelize-to-prisma.js

# Run rollback
node scripts/rollback-migration.js
```

### Custom Migration

For custom migration needs, modify the scripts in `scripts/` directory:
- `migrate-sequelize-to-prisma.js` - Main migration logic
- `rollback-migration.js` - Rollback functionality

## 🔧 Configuration Options

### Migration Batch Size

Default batch processing handles all records. For large datasets, you can modify the scripts to process in batches:

```javascript
// In migrate-sequelize-to-prisma.js
const BATCH_SIZE = 1000; // Adjust as needed
```

### Selective Migration

To migrate only specific tables, comment out unwanted migration methods in the `runMigration()` function.

## 📈 Performance Considerations

### Large Datasets
- Migration time scales with data size
- Consider running during low-traffic periods
- Monitor database performance during migration

### Memory Usage
- Large datasets may require increased Node.js memory
- Run with: `node --max-old-space-size=4096 migrate.js`

## 🛡️ Safety Features

### Automatic Backups
- Full data backup created before migration begins
- Backup stored in `./backups/migration_backup.json`
- Backup includes all table data with timestamps

### Validation Checks
- Pre-migration environment validation
- Real-time migration progress tracking
- Post-migration data integrity validation
- Automatic rollback on critical failures

### Error Handling
- Graceful handling of individual record failures
- Detailed error logging for troubleshooting
- Migration continues despite individual record errors

## 📞 Support

### Getting Help

1. **Check Logs**: Review console output and log files
2. **Validate Data**: Use the validation features in the migration tool
3. **Check Reports**: Examine generated JSON reports for details
4. **Environment Check**: Verify all required environment variables

### Emergency Rollback

If migration fails critically:

```bash
# Immediate rollback
node migrate.js
# Select option 2

# Or manual rollback
node scripts/rollback-migration.js
```

## ✅ Success Criteria

Migration is successful when:

- [ ] All data tables show matching counts in validation
- [ ] No critical errors in migration logs
- [ ] Application functions correctly with migrated data
- [ ] Performance meets or exceeds expectations
- [ ] Backup files are safely stored

## 🎯 Next Steps

After successful migration:

1. **Update Application Config**: Switch to Prisma in production
2. **Run Integration Tests**: Verify all services work with migrated data
3. **Performance Monitoring**: Monitor query performance improvements
4. **Documentation Update**: Update API documentation for new schema
5. **Team Training**: Train team on Prisma usage and best practices

---

## 📋 Quick Reference

```bash
# Start migration tool
node migrate.js

# Direct migration
node scripts/migrate-sequelize-to-prisma.js

# Direct rollback
node scripts/rollback-migration.js

# Check status
node migrate.js  # Option 3

# Validate data
node migrate.js  # Option 4
```

**Remember**: Always backup your data before migration and test thoroughly in staging before production deployment!