#!/bin/bash

# ML API Startup Script
# This script starts the Flask-based ML prediction API

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Starting ML Prediction API..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if required packages are installed
python -c "import flask" 2>/dev/null || {
    echo "❌ Flask not installed. Installing dependencies..."
    pip install -r requirements.txt
}

# Set environment variables
export FLASK_APP=api-simple.py
export FLASK_ENV=development
export PYTHONUNBUFFERED=1

# Start the API
echo "✅ Starting Flask server on http://localhost:5001"
echo "📊 Available endpoints:"
echo "   - POST /predict/churn"
echo "   - POST /predict/maintenance"
echo "   - GET  /health"
echo ""

python api-simple.py
