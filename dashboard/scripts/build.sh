#!/bin/bash

# Production Build Script for PropertyFlow AI Dashboard
# This script handles environment-specific builds with optimization

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_LINT=false
ANALYZE_BUNDLE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --skip-lint)
      SKIP_LINT=true
      shift
      ;;
    --analyze)
      ANALYZE_BUNDLE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -e, --environment ENV    Set environment (development|staging|production)"
      echo "  --skip-tests            Skip running tests"
      echo "  --skip-lint             Skip linting"
      echo "  --analyze               Analyze bundle size"
      echo "  -h, --help              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🚀 Building PropertyFlow AI Dashboard for ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo "Valid environments: development, staging, production"
  exit 1
fi

# Set build date
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo -e "${YELLOW}📅 Build date: $BUILD_DATE${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --silent

# Run linting
if [ "$SKIP_LINT" = false ]; then
  echo -e "${YELLOW}🔍 Running linter...${NC}"
  npm run lint || {
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
  }
fi

# Run tests
if [ "$SKIP_TESTS" = false ]; then
  echo -e "${YELLOW}🧪 Running tests...${NC}"
  npm run test -- --coverage --watchAll=false || {
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
  }
fi

# Set environment file
ENV_FILE=".env.${ENVIRONMENT}"
if [ -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}⚙️  Using environment file: $ENV_FILE${NC}"
  cp "$ENV_FILE" .env.local
else
  echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
  exit 1
fi

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build || {
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
}

# Analyze bundle if requested
if [ "$ANALYZE_BUNDLE" = true ]; then
  echo -e "${YELLOW}📊 Analyzing bundle size...${NC}"
  npm run analyze || {
    echo -e "${YELLOW}⚠️  Bundle analysis failed (continuing)${NC}"
  }
fi

# Generate build info
echo -e "${YELLOW}📝 Generating build info...${NC}"
cat > build/build-info.json << EOF
{
  "environment": "$ENVIRONMENT",
  "version": "$(node -p "require('./package.json').version")",
  "buildDate": "$BUILD_DATE",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf "dashboard-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).tar.gz" -C build .

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${GREEN}📁 Build output: ./build/${NC}"
echo -e "${GREEN}📦 Deployment package created${NC}"

# Display build summary
echo -e "\n${YELLOW}📊 Build Summary:${NC}"
echo "Environment: $ENVIRONMENT"
echo "Version: $(node -p "require('./package.json').version")"
echo "Build Date: $BUILD_DATE"
echo "Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo "Build Size: $(du -sh build | cut -f1)"