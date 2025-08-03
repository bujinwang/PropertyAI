#!/bin/bash

echo "🚀 Starting Rental API Testing Suite"
echo "===================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env with your actual configuration values"
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

# Start the server in background
echo "🌟 Starting backend server..."
npm run dev:node &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Run the tests
echo "🧪 Running Rental API tests..."
npx ts-node test-rental-api.ts

# Stop the server
echo "🛑 Stopping server..."
kill $SERVER_PID

echo "✅ Testing complete!"