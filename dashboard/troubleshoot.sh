#!/bin/bash

echo "🔍 PropertyAI Dashboard Troubleshooting Script"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the dashboard directory."
    exit 1
fi

echo "✅ Found package.json"

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js version: $node_version"
else
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm version
echo "📋 Checking npm version..."
npm_version=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ npm version: $npm_version"
else
    echo "❌ npm is not installed or not in PATH"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ node_modules directory exists"
fi

# Check for critical files
echo "📋 Checking critical files..."
critical_files=(
    "src/index.html"
    "src/index.tsx"
    "src/App.tsx"
    "src/index.css"
    "src/App.css"
    "vite.config.ts"
    ".env"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
    fi
done

# Clear any existing build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf build dist .vite

# Try to start the development server
echo "🚀 Starting development server..."
echo "If the server starts successfully, open http://localhost:3000 in your browser"
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev