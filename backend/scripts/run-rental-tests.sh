#!/bin/bash

# Rental API Test Runner
echo "🧪 Running Rental API Tests"
echo "=========================="

# Check if the server is running
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "⚠️  API server is not running on localhost:5000"
    echo "   Please start the server first: npm run dev"
    echo "   Skipping API tests..."
    exit 0
fi

# Run the test script
echo "🔍 Testing Rental API endpoints..."
npx ts-node scripts/test-rental-api.ts

echo "✅ Rental API tests completed"