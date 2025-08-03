#!/bin/bash

# Migration Rollback Script
# Use this script to rollback the Phase 2 migration if needed

set -e

echo "🔄 Migration Rollback Script"
echo "============================"

echo "⚠️  WARNING: This will rollback all Phase 2 migration changes!"
echo "This includes:"
echo "  - Removing migrated rental data"
echo "  - Restoring original permissions"
echo "  - Removing deprecation middleware"
echo ""

read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

echo "🔄 Starting rollback process..."

# Rollback data migration
echo "📊 Rolling back data migration..."
if [ -f "scripts/migrate-to-rental.ts" ]; then
    npx ts-node scripts/migrate-to-rental.ts --rollback
else
    echo "⚠️  Migration script not found, skipping data rollback"
fi

# Remove created middleware files
echo "🗑️  Removing created middleware files..."
rm -f src/middleware/deprecation.ts
rm -f src/middleware/legacy-mapping.ts
rm -f src/utils/legacy-monitoring.ts

# Remove documentation
echo "📚 Removing migration documentation..."
rm -f docs/API_MIGRATION_GUIDE.md

echo ""
echo "✅ Rollback completed!"
echo ""
echo "Manual steps required:"
echo "  1. Remove rental route handlers from your Express app"
echo "  2. Restore original property/unit route handlers"
echo "  3. Update any modified route files"
echo "  4. Test the application"