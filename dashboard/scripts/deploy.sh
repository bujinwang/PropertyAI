#!/bin/bash

# Deployment Script for PropertyFlow AI Dashboard
# Handles deployment to different environments with health checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
DRY_RUN=false
SKIP_HEALTH_CHECK=false
ROLLBACK=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-health-check)
      SKIP_HEALTH_CHECK=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -e, --environment ENV    Set environment (staging|production)"
      echo "  --dry-run               Show what would be deployed without deploying"
      echo "  --skip-health-check     Skip post-deployment health checks"
      echo "  --rollback              Rollback to previous deployment"
      echo "  -h, --help              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🚀 Deploying PropertyFlow AI Dashboard to ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo "Valid environments: staging, production"
  exit 1
fi

# Set environment-specific variables
case $ENVIRONMENT in
  staging)
    DEPLOY_URL="https://staging-dashboard.propertyflow.ai"
    S3_BUCKET="propertyflow-dashboard-staging"
    CLOUDFRONT_DISTRIBUTION="E1234567890ABC"
    ;;
  production)
    DEPLOY_URL="https://dashboard.propertyflow.ai"
    S3_BUCKET="propertyflow-dashboard-production"
    CLOUDFRONT_DISTRIBUTION="E0987654321XYZ"
    ;;
esac

# Function to check if AWS CLI is configured
check_aws_cli() {
  if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI.${NC}"
    exit 1
  fi
  
  if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure'.${NC}"
    exit 1
  fi
}

# Function to backup current deployment
backup_deployment() {
  echo -e "${YELLOW}💾 Creating backup of current deployment...${NC}"
  BACKUP_KEY="backups/$(date +%Y%m%d-%H%M%S)"
  
  if [ "$DRY_RUN" = false ]; then
    aws s3 sync s3://$S3_BUCKET s3://$S3_BUCKET-backups/$BACKUP_KEY --quiet || {
      echo -e "${YELLOW}⚠️  Backup failed (continuing)${NC}"
    }
  else
    echo -e "${BLUE}[DRY RUN] Would backup to s3://$S3_BUCKET-backups/$BACKUP_KEY${NC}"
  fi
}

# Function to deploy to S3
deploy_to_s3() {
  echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
  
  if [ "$DRY_RUN" = false ]; then
    # Upload files with appropriate cache headers
    aws s3 sync build/ s3://$S3_BUCKET \
      --delete \
      --cache-control "public, max-age=31536000" \
      --exclude "*.html" \
      --exclude "service-worker.js" \
      --exclude "build-info.json"
    
    # Upload HTML files with no cache
    aws s3 sync build/ s3://$S3_BUCKET \
      --cache-control "no-cache, no-store, must-revalidate" \
      --include "*.html" \
      --include "service-worker.js" \
      --include "build-info.json"
  else
    echo -e "${BLUE}[DRY RUN] Would sync build/ to s3://$S3_BUCKET${NC}"
  fi
}

# Function to invalidate CloudFront
invalidate_cloudfront() {
  echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
  
  if [ "$DRY_RUN" = false ]; then
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
      --distribution-id $CLOUDFRONT_DISTRIBUTION \
      --paths "/*" \
      --query 'Invalidation.Id' \
      --output text)
    
    echo -e "${BLUE}📋 Invalidation ID: $INVALIDATION_ID${NC}"
    
    # Wait for invalidation to complete
    echo -e "${YELLOW}⏳ Waiting for invalidation to complete...${NC}"
    aws cloudfront wait invalidation-completed \
      --distribution-id $CLOUDFRONT_DISTRIBUTION \
      --id $INVALIDATION_ID
  else
    echo -e "${BLUE}[DRY RUN] Would invalidate CloudFront distribution $CLOUDFRONT_DISTRIBUTION${NC}"
  fi
}

# Function to perform health check
health_check() {
  if [ "$SKIP_HEALTH_CHECK" = true ]; then
    echo -e "${YELLOW}⏭️  Skipping health check${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}🏥 Performing health check...${NC}"
  
  # Wait a bit for deployment to propagate
  sleep 30
  
  # Check if the site is accessible
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOY_URL)
  
  if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_STATUS)${NC}"
  else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_STATUS)${NC}"
    return 1
  fi
  
  # Check if build info is accessible
  BUILD_INFO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOY_URL/build-info.json)
  
  if [ "$BUILD_INFO_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Build info accessible${NC}"
    curl -s $DEPLOY_URL/build-info.json | jq '.'
  else
    echo -e "${YELLOW}⚠️  Build info not accessible (HTTP $BUILD_INFO_STATUS)${NC}"
  fi
}

# Function to rollback deployment
rollback_deployment() {
  echo -e "${YELLOW}🔄 Rolling back deployment...${NC}"
  
  # Find latest backup
  LATEST_BACKUP=$(aws s3 ls s3://$S3_BUCKET-backups/ --recursive | sort | tail -n 1 | awk '{print $4}' | cut -d'/' -f1-2)
  
  if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}❌ No backup found for rollback${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}📦 Rolling back to: $LATEST_BACKUP${NC}"
  
  if [ "$DRY_RUN" = false ]; then
    aws s3 sync s3://$S3_BUCKET-backups/$LATEST_BACKUP/ s3://$S3_BUCKET --delete
    invalidate_cloudfront
  else
    echo -e "${BLUE}[DRY RUN] Would rollback from s3://$S3_BUCKET-backups/$LATEST_BACKUP/${NC}"
  fi
}

# Main deployment flow
main() {
  if [ "$ROLLBACK" = true ]; then
    check_aws_cli
    rollback_deployment
    health_check
    echo -e "${GREEN}✅ Rollback completed successfully!${NC}"
    return 0
  fi
  
  # Check prerequisites
  if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build directory not found. Run build script first.${NC}"
    exit 1
  fi
  
  check_aws_cli
  
  # Deployment confirmation for production
  if [ "$ENVIRONMENT" = "production" ] && [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      echo -e "${YELLOW}❌ Deployment cancelled${NC}"
      exit 0
    fi
  fi
  
  # Execute deployment steps
  backup_deployment
  deploy_to_s3
  invalidate_cloudfront
  
  if health_check; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${GREEN}🌐 Application URL: $DEPLOY_URL${NC}"
  else
    echo -e "${RED}❌ Deployment failed health check${NC}"
    echo -e "${YELLOW}🔄 Consider rolling back with: $0 --rollback -e $ENVIRONMENT${NC}"
    exit 1
  fi
}

# Run main function
main