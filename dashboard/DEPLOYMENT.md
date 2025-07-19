# PropertyFlow AI Dashboard - Deployment Guide

This document provides comprehensive instructions for deploying the PropertyFlow AI Dashboard to different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Methods](#deployment-methods)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Required Tools

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **AWS CLI**: For cloud deployments (configured with appropriate credentials)
- **Docker**: For containerized deployments
- **Git**: For version control

### AWS Services Setup

For cloud deployments, ensure the following AWS services are configured:

- **S3 Bucket**: For hosting static files
- **CloudFront**: For CDN distribution
- **Route 53**: For DNS management (optional)
- **IAM**: Proper permissions for deployment

## Environment Configuration

### Environment Files

The application supports three environments, each with its own configuration file:

- **Development**: `.env` (local development)
- **Staging**: `.env.staging` (testing environment)
- **Production**: `.env.production` (live environment)

### Required Environment Variables

```bash
# API Configuration
REACT_APP_API_BASE_URL=https://api.propertyflow.ai/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=$npm_package_version
REACT_APP_BUILD_DATE=$BUILD_DATE

# Analytics and Monitoring
REACT_APP_ANALYTICS_ID=GA_MEASUREMENT_ID
REACT_APP_SENTRY_DSN=SENTRY_DSN_URL
REACT_APP_PERFORMANCE_MONITORING=true

# Feature Flags
REACT_APP_AI_FEATURES_ENABLED=true
REACT_APP_DEBUG_MODE=false
REACT_APP_ERROR_REPORTING=true

# Security
REACT_APP_CSP_ENABLED=true
REACT_APP_HTTPS_ONLY=true
```

### AWS Configuration

Set up AWS credentials using one of these methods:

```bash
# Method 1: AWS CLI
aws configure

# Method 2: Environment Variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1

# Method 3: IAM Roles (recommended for EC2/ECS)
```

## Build Process

### Local Build

```bash
# Install dependencies
npm ci

# Build for specific environment
./scripts/build.sh --environment production

# Build with additional options
./scripts/build.sh --environment staging --analyze --skip-tests
```

### Build Script Options

- `--environment`: Target environment (development|staging|production)
- `--skip-tests`: Skip running tests
- `--skip-lint`: Skip linting
- `--analyze`: Analyze bundle size
- `--help`: Show help message

### Build Artifacts

After a successful build, you'll find:

- `build/`: Built application files
- `build/build-info.json`: Build metadata
- `dashboard-{environment}-{timestamp}.tar.gz`: Deployment package

## Deployment Methods

### 1. AWS S3 + CloudFront (Recommended)

```bash
# Deploy to staging
./scripts/deploy.sh --environment staging

# Deploy to production
./scripts/deploy.sh --environment production

# Dry run (preview changes)
./scripts/deploy.sh --environment production --dry-run

# Skip health checks
./scripts/deploy.sh --environment production --skip-health-check
```

### 2. Docker Deployment

```bash
# Build Docker image
docker build -t propertyflow-dashboard:latest \
  --build-arg ENVIRONMENT=production \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VERSION=$(node -p "require('./package.json').version") \
  .

# Run container
docker run -d \
  --name propertyflow-dashboard \
  -p 8080:8080 \
  propertyflow-dashboard:latest

# Health check
curl http://localhost:8080/health
```

### 3. CI/CD with GitHub Actions

The repository includes GitHub Actions workflows for automated deployment:

- **Trigger**: Push to `main` (production) or `develop` (staging)
- **Process**: Test → Build → Security Scan → Deploy
- **Notifications**: Slack notifications for deployment status

#### Required GitHub Secrets

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# Monitoring
SNYK_TOKEN
SLACK_WEBHOOK_URL

# Optional
SENTRY_AUTH_TOKEN
```

### 4. Manual Deployment

For environments without automated deployment:

```bash
# 1. Build the application
npm run build

# 2. Upload to your hosting provider
# Example for generic hosting:
rsync -avz build/ user@server:/var/www/propertyflow-dashboard/

# 3. Configure web server (nginx example)
sudo cp nginx.conf /etc/nginx/sites-available/propertyflow-dashboard
sudo ln -s /etc/nginx/sites-available/propertyflow-dashboard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Monitoring and Analytics

### Error Monitoring

The application includes comprehensive error monitoring:

- **Error Boundary**: Catches React component errors
- **Global Error Handler**: Captures JavaScript errors
- **Unhandled Promise Rejections**: Tracks async errors
- **API Error Tracking**: Monitors API failures

### Performance Monitoring

Automatic tracking of:

- **Core Web Vitals**: LCP, FID, CLS
- **API Performance**: Request/response times
- **Component Performance**: Render times
- **Bundle Analysis**: Code splitting effectiveness

### Analytics Integration

- **Google Analytics 4**: User behavior tracking
- **Custom Events**: AI interaction tracking
- **Page Views**: Navigation tracking
- **User Properties**: Role-based analytics

### Health Checks

The application provides several health check endpoints:

- `/health`: Basic health status
- `/build-info.json`: Build and version information
- Service worker registration status

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+

# Run with verbose logging
npm run build --verbose
```

#### Deployment Failures

```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify S3 bucket permissions
aws s3 ls s3://your-bucket-name

# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID
```

#### Runtime Errors

1. Check browser console for JavaScript errors
2. Verify API endpoints are accessible
3. Check network requests in DevTools
4. Review error monitoring dashboard

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Set in environment file
REACT_APP_DEBUG_MODE=true

# Or temporarily in browser console
localStorage.setItem('debug', 'true')
```

### Log Analysis

```bash
# View deployment logs
./scripts/deploy.sh --environment staging 2>&1 | tee deployment.log

# Check build logs
./scripts/build.sh --environment production 2>&1 | tee build.log

# Monitor application logs (if using centralized logging)
aws logs tail /aws/lambda/propertyflow-dashboard --follow
```

## Rollback Procedures

### Automatic Rollback

```bash
# Rollback to previous deployment
./scripts/deploy.sh --rollback --environment production
```

### Manual Rollback

```bash
# 1. Find previous deployment backup
aws s3 ls s3://propertyflow-dashboard-production-backups/

# 2. Restore from backup
aws s3 sync s3://propertyflow-dashboard-production-backups/BACKUP_DATE/ \
  s3://propertyflow-dashboard-production/ --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Emergency Procedures

In case of critical issues:

1. **Immediate Response**:
   ```bash
   # Quick rollback
   ./scripts/deploy.sh --rollback --environment production
   ```

2. **Communication**:
   - Notify team via Slack/email
   - Update status page if available
   - Document incident details

3. **Investigation**:
   - Check error monitoring dashboard
   - Review recent changes
   - Analyze logs and metrics

4. **Resolution**:
   - Fix identified issues
   - Test in staging environment
   - Deploy fix with careful monitoring

## Security Considerations

### Content Security Policy

The application includes CSP headers for security:

```nginx
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### HTTPS Enforcement

Always use HTTPS in production:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name dashboard.propertyflow.ai;
    return 301 https://$server_name$request_uri;
}
```

### Environment Secrets

Never commit sensitive information:

- Use environment variables for secrets
- Rotate API keys regularly
- Use AWS Secrets Manager for production secrets
- Implement proper IAM policies

## Performance Optimization

### Build Optimizations

- **Code Splitting**: Automatic chunk splitting by route
- **Tree Shaking**: Remove unused code
- **Minification**: Compress JavaScript and CSS
- **Compression**: Gzip/Brotli compression

### Runtime Optimizations

- **Service Worker**: Offline functionality and caching
- **CDN**: CloudFront for global distribution
- **Image Optimization**: Lazy loading and compression
- **Bundle Analysis**: Regular size monitoring

### Monitoring Performance

```bash
# Analyze bundle size
npm run analyze

# Lighthouse audit
npx lighthouse https://dashboard.propertyflow.ai --output html

# Web Vitals monitoring
# Check Google PageSpeed Insights
```

## Maintenance

### Regular Tasks

- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance audit and optimization review
- **Annually**: Architecture review and technology updates

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Security audit
npm audit
npm audit fix
```

### Backup Strategy

- **Automated**: Daily backups via deployment script
- **Retention**: 30 days for staging, 90 days for production
- **Testing**: Monthly restore tests
- **Documentation**: Backup and restore procedures

## Support and Contacts

For deployment issues or questions:

- **Development Team**: dev-team@propertyflow.ai
- **DevOps Team**: devops@propertyflow.ai
- **Emergency Contact**: +1-XXX-XXX-XXXX

### Useful Links

- [AWS Console](https://console.aws.amazon.com/)
- [GitHub Repository](https://github.com/propertyflow/dashboard)
- [Monitoring Dashboard](https://monitoring.propertyflow.ai)
- [Status Page](https://status.propertyflow.ai)