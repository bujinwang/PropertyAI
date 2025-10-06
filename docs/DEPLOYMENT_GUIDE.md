# PropertyFlow AI - Deployment Guide

## Overview
This guide covers deploying PropertyFlow AI to production environments.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Backend Deployment](#backend-deployment)
4. [Database Setup](#database-setup)
5. [ML API Deployment](#ml-api-deployment)
6. [Dashboard Deployment](#dashboard-deployment)
7. [Mobile App Deployment](#mobile-app-deployment)
8. [Security Checklist](#security-checklist)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services
- **PostgreSQL**: Version 14+ (primary database)
- **Redis**: Version 6+ (caching & rate limiting)
- **Node.js**: Version 20.x
- **Python**: Version 3.9+ (ML API)
- **Docker**: Optional but recommended

### Cloud Services (Optional)
- **AWS S3**: File storage
- **Google Cloud**: ML model hosting
- **Twilio**: SMS notifications
- **Stripe**: Payment processing
- **SendGrid**: Email delivery

---

## Environment Configuration

### Backend (.env)
```bash
# Application
NODE_ENV=production
PORT=3001
API_URL=https://api.propertyflow.ai

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
MONGODB_URI=mongodb://user:pass@host:27017/dbname

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=(use strong random password)

# JWT  
JWT_SECRET=(generate with: openssl rand -base64 64)
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=(generate with: openssl rand -base64 64)
REFRESH_TOKEN_EXPIRES_IN=7d

# ML API
ML_API_URL=http://ml-api:5000
ML_API_TIMEOUT=5000

# Security
CSRF_SECRET=(generate with: openssl rand -base64 32)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# AWS S3
AWS_ACCESS_KEY_ID=(from AWS console)
AWS_SECRET_ACCESS_KEY=(from AWS console)
AWS_S3_BUCKET=propertyflow-uploads
AWS_REGION=us-east-1

# Email
SENDGRID_API_KEY=(from SendGrid dashboard)
FROM_EMAIL=noreply@propertyflow.ai

# SMS
TWILIO_ACCOUNT_SID=(from Twilio console)
TWILIO_AUTH_TOKEN=(from Twilio console)
TWILIO_PHONE_NUMBER=(from Twilio console)

# Payment
STRIPE_SECRET_KEY=(from Stripe dashboard)
STRIPE_WEBHOOK_SECRET=(from Stripe dashboard)

# Monitoring
SENTRY_DSN=(from Sentry project settings)
```

### Dashboard (.env)
```bash
VITE_API_URL=https://api.propertyflow.ai
VITE_GOOGLE_CLIENT_ID=(from Google Cloud Console)
VITE_STRIPE_PUBLIC_KEY=(from Stripe dashboard)
```

### Mobile (.env)
```bash
EXPO_PUBLIC_API_URL=https://api.propertyflow.ai
EXPO_PUBLIC_GOOGLE_CLIENT_ID=(from Google Cloud Console)
```

### ML API (.env)
```bash
ML_API_PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/propertyflow
```

---

## Backend Deployment

### Option 1: Docker (Recommended)

**1. Create Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server.js"]
```

**2. Build and run**:
```bash
docker build -t propertyflow-backend .
docker run -p 3001:3001 --env-file .env propertyflow-backend
```

### Option 2: PM2

**1. Install PM2**:
```bash
npm install -g pm2
```

**2. Create ecosystem file** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'propertyflow-api',
    script: 'dist/server.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
```

**3. Deploy**:
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Kubernetes

**1. Create deployment** (`k8s/backend-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: propertyflow-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: propertyflow-backend
  template:
    metadata:
      labels:
        app: propertyflow-backend
    spec:
      containers:
      - name: backend
        image: propertyflow-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: production
        envFrom:
        - secretRef:
            name: propertyflow-secrets
```

---

## Database Setup

### PostgreSQL

**1. Create database**:
```bash
psql -U postgres
CREATE DATABASE propertyflow;
CREATE USER propertyflow_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE propertyflow TO propertyflow_user;
```

**2. Run migrations**:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

**3. Seed initial data** (optional):
```bash
npm run db:seed
```

### MongoDB

**1. Create database**:
```bash
mongosh
use propertyflow
db.createUser({
  user: "propertyflow_user",
  pwd: "your_password",
  roles: [{ role: "readWrite", db: "propertyflow" }]
})
```

### Redis

**1. Configure Redis**:
```bash
# Edit redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
requirepass your_redis_password
```

**2. Start Redis**:
```bash
redis-server /etc/redis/redis.conf
```

---

## ML API Deployment

### Option 1: Docker

**1. Create Dockerfile** (`backend/src/predictive-analytics/Dockerfile`):
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY api.py .
COPY models/ models/

# Expose port
EXPOSE 5000

# Start server
CMD ["python", "api.py"]
```

**2. Build and run**:
```bash
docker build -t propertyflow-ml-api .
docker run -p 5000:5000 --env-file .env propertyflow-ml-api
```

### Option 2: Direct

**1. Install dependencies**:
```bash
cd backend/src/predictive-analytics
pip install -r requirements.txt
```

**2. Run with gunicorn** (production):
```bash
gunicorn -w 4 -b 0.0.0.0:5000 api:app
```

---

## Dashboard Deployment

### Build

```bash
cd dashboard
npm install
npm run build
```

### Option 1: Nginx

**1. Copy build files**:
```bash
cp -r dist/* /var/www/propertyflow/
```

**2. Configure Nginx** (`/etc/nginx/sites-available/propertyflow`):
```nginx
server {
    listen 80;
    server_name dashboard.propertyflow.ai;

    root /var/www/propertyflow;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**3. Enable site**:
```bash
ln -s /etc/nginx/sites-available/propertyflow /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Option 2: CDN (Recommended)

Deploy to Vercel, Netlify, or CloudFlare Pages:

**Vercel**:
```bash
npm install -g vercel
vercel --prod
```

---

## Mobile App Deployment

### iOS

**1. Build for production**:
```bash
cd mobile
eas build --platform ios --profile production
```

**2. Submit to App Store**:
```bash
eas submit --platform ios
```

### Android

**1. Build for production**:
```bash
eas build --platform android --profile production
```

**2. Submit to Play Store**:
```bash
eas submit --platform android
```

### OTA Updates

```bash
eas update --branch production --message "Bug fixes and improvements"
```

---

## Security Checklist

### Pre-Deployment
- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] CORS configured for specific domains only
- [ ] Rate limiting enabled on all routes
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] Security headers configured (Helmet)
- [ ] Database credentials rotated
- [ ] JWT secrets are strong and unique
- [ ] File upload size limits configured
- [ ] API keys stored in secure vault

### Post-Deployment
- [ ] Run security scan (OWASP ZAP)
- [ ] Test authentication flows
- [ ] Verify rate limiting
- [ ] Test CSRF protection
- [ ] Check security headers
- [ ] Audit logging functional
- [ ] Monitor error rates
- [ ] Set up alerts for security events

---

## Monitoring

### Application Monitoring

**Prometheus + Grafana**:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'propertyflow-backend'
    static_configs:
      - targets: ['localhost:3001']
```

**Key Metrics**:
- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- CPU usage
- Memory usage
- Database connections
- Cache hit rate

### Log Aggregation

**ELK Stack or CloudWatch**:
```javascript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Error Tracking

**Sentry Integration**:
```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Uptime Monitoring

- **Pingdom**: External monitoring
- **UptimeRobot**: Free uptime checks
- **Custom**: Health check endpoints

---

## Troubleshooting

### Common Issues

**1. Database Connection Fails**
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U propertyflow_user -d propertyflow -h localhost

# Check DATABASE_URL format
# postgresql://user:password@host:5432/database
```

**2. Redis Connection Fails**
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

**3. High Memory Usage**
```bash
# Check Node.js memory
pm2 monit

# Increase heap size if needed
NODE_OPTIONS="--max-old-space-size=4096" node dist/server.js
```

**4. ML API Slow**
```bash
# Check ML API health
curl http://localhost:5000/health

# Increase timeout
ML_API_TIMEOUT=10000
```

**5. Build Fails**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node -v  # Should be 20.x
```

---

## Backup Strategy

### Database Backups

**Automated PostgreSQL**:
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR=/backups/propertyflow
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U propertyflow_user propertyflow | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
```

**Cron job**:
```bash
0 2 * * * /usr/local/bin/backup.sh
```

---

## Scaling Considerations

### Horizontal Scaling
- Load balancer (Nginx, AWS ALB)
- Multiple backend instances (PM2 cluster mode)
- Database read replicas
- Redis cluster

### Caching Strategy
- Redis for session & rate limiting
- CDN for static assets
- Database query caching
- HTTP caching headers

### Performance Optimization
- Enable gzip compression
- Optimize database indexes
- Implement pagination
- Use connection pooling
- Enable HTTP/2

---

## Support & Maintenance

### Regular Tasks
- [ ] Monitor error rates daily
- [ ] Review security logs weekly
- [ ] Update dependencies monthly
- [ ] Database backups verified weekly
- [ ] Performance review monthly
- [ ] Security audit quarterly

### Emergency Contacts
- DevOps Lead: devops@propertyflow.ai
- Security Team: security@propertyflow.ai
- On-Call: +1-XXX-XXX-XXXX

---

**Last Updated**: 2024-01-06  
**Version**: 1.0  
**Maintained By**: PropertyFlow AI DevOps Team
