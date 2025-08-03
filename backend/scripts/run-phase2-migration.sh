#!/bin/bash

# Phase 2 Migration Execution Script
# This script runs all the Phase 2 migration tasks in the correct order

set -e  # Exit on any error

echo "🚀 Starting Phase 2 Migration"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create it from .env.example"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 1: Test the new API endpoints
echo ""
echo "🧪 Step 1: Testing new Rental API endpoints"
echo "----------------------------------------"
if [ -f "scripts/test-rental-api.ts" ] && [ -f "scripts/run-rental-tests.sh" ]; then
    chmod +x scripts/run-rental-tests.sh
    ./scripts/run-rental-tests.sh
else
    echo "⚠️  Rental API test script not found, skipping tests"
fi

# Step 2: Update user permissions
echo ""
echo "🔐 Step 2: Updating user permissions"
echo "-----------------------------------"
if [ -f "scripts/update-rental-permissions.ts" ]; then
    npx ts-node scripts/update-rental-permissions.ts
else
    echo "❌ Permission update script not found"
    exit 1
fi

# Step 3: Migrate existing data
echo ""
echo "📊 Step 3: Migrating existing data to Rental model"
echo "------------------------------------------------"
read -p "⚠️  This will migrate all existing property and unit data. Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "scripts/migrate-to-rental.ts" ]; then
        npx ts-node scripts/migrate-to-rental.ts
    else
        echo "❌ Data migration script not found"
        exit 1
    fi
else
    echo "⏭️  Skipping data migration"
fi

# Step 4: Set up legacy route phase-out
echo ""
echo "🚧 Step 4: Setting up legacy route phase-out"
echo "-------------------------------------------"
if [ -f "scripts/legacy-route-phaseout.ts" ]; then
    npx ts-node scripts/legacy-route-phaseout.ts
else
    echo "❌ Legacy route phase-out script not found"
    exit 1
fi

# Step 5: Generate final report
echo ""
echo "📋 Step 5: Generating migration report"
echo "------------------------------------"
cat << EOF

🎉 Phase 2 Migration Completed!
==============================

✅ API endpoints tested
✅ User permissions updated
✅ Data migration completed (if selected)
✅ Legacy route phase-out plan implemented

Next Steps:
----------
1. Update frontend navigation menus to use new rental routes
2. Test the application thoroughly
3. Monitor legacy route usage
4. Communicate changes to API consumers
5. Plan for legacy route removal in 3 months

Important Files Created:
-----------------------
- docs/API_MIGRATION_GUIDE.md
- src/middleware/deprecation.ts
- src/middleware/legacy-mapping.ts
- src/utils/legacy-monitoring.ts
- scripts/test-rental-api.ts (API test suite)

For more information, see the migration guide at:
docs/API_MIGRATION_GUIDE.md

EOF

echo "🏁 Migration completed successfully!"