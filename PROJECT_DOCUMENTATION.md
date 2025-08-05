# PropertyFlow AI - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Database Architecture](#database-architecture)
6. [API Documentation](#api-documentation)
7. [Development Setup](#development-setup)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Configuration](#deployment-configuration)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Security Framework](#security-framework)
12. [AI/ML Integration](#aiml-integration)
13. [Monitoring & Observability](#monitoring--observability)
14. [Microservices Architecture](#microservices-architecture)

## Project Overview

**PropertyFlow AI** is a comprehensive property management platform that leverages artificial intelligence to streamline operations, enhance communication, and optimize property performance. The platform provides a unified solution for property managers, owners, and tenants with powerful AI-driven features.

### Key Business Objectives
- Automate property management workflows
- Enhance tenant experience through AI-powered communication
- Optimize property performance with predictive analytics
- Streamline maintenance and vendor management
- Provide comprehensive financial management and reporting

### Target Users
- **Property Managers**: Full platform access for managing properties, tenants, and operations
- **Property Owners**: Dashboard access for monitoring property performance and financials
- **Tenants**: Mobile app access for rent payments, maintenance requests, and communication
- **Vendors**: Portal access for work orders, payments, and performance tracking
- **Administrators**: System-wide configuration and management capabilities

## Architecture Overview

PropertyFlow AI follows a **microservices architecture** with three main application layers:

### System Architecture Layers

1. **Frontend Layer**
   - **Dashboard**: React web application for property managers and administrators
   - **Property App**: React Native mobile application for tenants and property owners
   - **Contractor App**: React Native mobile application for vendors and contractors

2. **Backend Services Layer**
   - **API Gateway**: Central entry point for all client requests
   - **Microservices**: Domain-specific services for different business functions
   - **AI Services**: Specialized AI/ML services for predictive analytics and automation

3. **Infrastructure Layer**
   - **Databases**: PostgreSQL (primary), MongoDB (secondary), Redis (cache)
   - **Message Queue**: BullMQ for asynchronous processing
   - **Cloud Storage**: AWS S3 for file storage
   - **Container Orchestration**: Docker + Kubernetes on Google Cloud Platform

### Communication Patterns
- **Synchronous**: REST APIs for immediate response requirements
- **Asynchronous**: Event-driven architecture using Redis pub/sub and BullMQ
- **Real-time**: WebSocket connections for live updates and notifications

## Technology Stack

### Backend Technologies
- **Runtime**: Node.js 20.x with TypeScript
- **Framework**: Express.js with middleware ecosystem
- **ORM**: Prisma for PostgreSQL, Mongoose for MongoDB
- **Authentication**: JWT tokens with refresh token rotation
- **Validation**: Express-validator and Joi for input validation
- **Security**: Helmet, CORS, rate limiting, and input sanitization
- **Queue Processing**: BullMQ with Redis backend
- **API Documentation**: OpenAPI 3.0 with Swagger UI

### Frontend Technologies
- **Dashboard**: React 18.2 + TypeScript + Vite
- **Mobile Apps**: React Native 0.74 + Expo SDK 51
- **UI Framework**: Material-UI v7 for web, React Native Elements for mobile
- **State Management**: React Query for server state, Context API for client state
- **Form Handling**: Formik + Yup for validation
- **Charts & Analytics**: Chart.js, Recharts for data visualization
- **Testing**: Jest, React Testing Library, Playwright for E2E

### Database Technologies
- **Primary Database**: PostgreSQL 13+ with comprehensive schema
- **Secondary Database**: MongoDB 4.4+ for unstructured data and logs
- **Cache Layer**: Redis 7+ for session management and caching
- **Search**: Full-text search capabilities with PostgreSQL
- **File Storage**: AWS S3 with CloudFront CDN

### AI/ML Technologies
- **Machine Learning**: Python with scikit-learn, TensorFlow, PyTorch
- **Natural Language Processing**: Google Gemini API, Hugging Face models
- **Computer Vision**: AWS Rekognition for image analysis
- **Predictive Analytics**: Custom Python services for forecasting
- **Sentiment Analysis**: NLP models for tenant communication analysis

### Infrastructure & DevOps
- **Cloud Platform**: Google Cloud Platform (GCP)
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with GKE (Google Kubernetes Engine)
- **Infrastructure as Code**: Terraform for cloud resource management
- **CI/CD**: GitHub Actions with environment-specific workflows
- **Monitoring**: OpenTelemetry, Prometheus, Grafana
- **Logging**: Structured logging with Pino and Winston

## System Components

### Core Microservices

#### 1. Users Service
**Responsibilities**: User authentication, authorization, profile management
- **Endpoints**: `/api/auth/*`, `/api/users/*`
- **Key Features**:
  - Multi-factor authentication (MFA)
  - Role-based access control (RBAC)
  - OAuth integration (Google, Facebook)
  - Password reset and account recovery
  - User profile management

#### 2. Properties Service
**Responsibilities**: Property and unit management
- **Endpoints**: `/api/properties/*`, `/api/units/*`
- **Key Features**:
  - Property CRUD operations
  - Unit management and configuration
  - Amenity management
  - Property analytics and insights

#### 3. Listings Service
**Responsibilities**: Property listing management and marketing
- **Endpoints**: `/api/listings/*`
- **Key Features**:
  - Listing creation and management
  - Multi-platform publishing (Zillow, Apartments.com, etc.)
  - SEO optimization
  - Lead tracking and management

#### 4. Applications Service
**Responsibilities**: Tenant application and screening
- **Endpoints**: `/api/applications/*`
- **Key Features**:
  - Online application forms
  - Background check integration (Checkr)
  - Document verification
  - Automated screening workflows

#### 5. Leases Service
**Responsibilities**: Lease management and tenant onboarding
- **Endpoints**: `/api/leases/*`
- **Key Features**:
  - Digital lease generation and signing (DocuSign)
  - Rent calculation and proration
  - Security deposit management
  - Lease renewal automation

#### 6. Maintenance Service
**Responsibilities**: Maintenance request and work order management
- **Endpoints**: `/api/maintenance/*`
- **Key Features**:
  - Tenant maintenance requests
  - Vendor assignment and management
  - Work order tracking
  - Predictive maintenance alerts

#### 7. Communications Service
**Responsibilities**: Multi-channel communication management
- **Endpoints**: `/api/communications/*`
- **Key Features**:
  - Email and SMS notifications
  - In-app messaging
  - Automated communication workflows
  - Template management

#### 8. Payments Service
**Responsibilities**: Financial transaction processing
- **Endpoints**: `/api/payments/*`
- **Key Features**:
  - Rent collection automation
  - Vendor payment processing
  - Financial reporting
  - Integration with Stripe, PayPal, Plaid

#### 9. AI Services
**Responsibilities**: Intelligent automation and insights
- **Endpoints**: `/api/ai/*`
- **Key Features**:
  - Predictive maintenance
  - Tenant communication analysis
  - Market rent optimization
  - Property description generation
  - Image analysis and tagging

### Supporting Services

#### 1. Notification Service
- Push notifications (Firebase Cloud Messaging)
- Email notifications (SendGrid)
- SMS notifications (Twilio)

#### 2. File Storage Service
- Document management with AWS S3
- Image optimization and CDN delivery
- Document scanning and OCR integration

#### 3. Analytics Service
- Property performance metrics
- Financial analytics and forecasting
- Tenant behavior analysis
- Market intelligence reports

## Database Architecture

### PostgreSQL Schema Design
The PostgreSQL database implements a comprehensive schema with 40+ tables covering all aspects of property management:

#### Core Entities
- **Users**: Complete user management with role-based permissions
- **Properties**: Property and rental unit information
- **Leases**: Lease agreements and tenant relationships
- **Transactions**: Financial transactions and payment records
- **Maintenance**: Work orders and vendor management

#### AI-Enhanced Entities
- **AIUsageLog**: Tracking AI service usage and costs
- **PhotoAnalysis**: Computer vision results for property images
- **PredictiveMaintenance**: ML-generated maintenance predictions
- **TenantIssuePrediction**: AI-powered tenant behavior insights

#### Business Intelligence Entities
- **MarketData**: Real estate market intelligence
- **VendorPerformance**: Vendor rating and performance metrics
- **TenantRating**: Tenant screening and rating system

### MongoDB Collections
- **Activity Logs**: User activity and system events
- **Communication History**: Message and notification logs
- **AI Training Data**: ML model training datasets
- **Cache Data**: Temporary data and session storage

### Redis Usage Patterns
- **Session Management**: User authentication sessions
- **Cache Layer**: API response caching
- **Queue Management**: Background job processing
- **Rate Limiting**: API rate limiting counters

## API Documentation

### API Design Principles
- **RESTful Architecture**: Resource-based URLs with HTTP methods
- **Versioning**: URL-based versioning (/api/v1/)
- **Pagination**: Cursor-based pagination for large datasets
- **Filtering**: Query parameter-based filtering
- **Sorting**: Multi-column sorting support
- **Rate Limiting**: Per-endpoint rate limiting with user tiers

### Authentication & Authorization
- **JWT Tokens**: Access tokens with 15-minute expiration
- **Refresh Tokens**: 7-day refresh tokens with rotation
- **MFA Support**: TOTP-based multi-factor authentication
- **OAuth Integration**: Google and Facebook OAuth support
- **Role-Based Access**: Granular permissions system

### Key API Endpoints

#### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
POST /api/auth/logout         # User logout
POST /api/auth/refresh        # Token refresh
POST /api/mfa/enable          # Enable MFA
POST /api/mfa/verify          # Verify MFA code
```

#### Property Management Endpoints
```
GET    /api/properties        # List properties
POST   /api/properties        # Create property
GET    /api/properties/:id    # Get property details
PUT    /api/properties/:id    # Update property
DELETE /api/properties/:id    # Delete property

GET    /api/units             # List units
POST   /api/units             # Create unit
GET    /api/units/:id         # Get unit details
```

#### Tenant Management Endpoints
```
GET    /api/tenants           # List tenants
POST   /api/tenants           # Create tenant
GET    /api/tenants/:id       # Get tenant details
PUT    /api/tenants/:id       # Update tenant

GET    /api/leases            # List leases
POST   /api/leases            # Create lease
GET    /api/leases/:id        # Get lease details
PUT    /api/leases/:id        # Update lease
```

#### Maintenance Endpoints
```
GET    /api/maintenance       # List maintenance requests
POST   /api/maintenance       # Create request
GET    /api/maintenance/:id   # Get request details
PUT    /api/maintenance/:id   # Update request
POST   /api/maintenance/:id/assign    # Assign vendor
POST   /api/maintenance/:id/complete  # Complete request
```

#### AI Services Endpoints
```
POST   /api/ai/predict-maintenance    # Predictive maintenance
POST   /api/ai/analyze-image        # Image analysis
POST   /api/ai/generate-description # Property description
GET    /api/ai/market-insights      # Market intelligence
```

## Development Setup

### Prerequisites
- **Node.js**: v20.x or higher
- **PostgreSQL**: 13+ with PostGIS extension
- **MongoDB**: 4.4+ with replica set configuration
- **Redis**: 7+ for caching and queues
- **Python**: 3.8+ for AI services
- **Docker**: Latest stable version
- **Git**: Version control

### Environment Setup

#### 1. Clone the Repository
```bash
git clone [repository-url]
cd PropertyFlow AI
```

#### 2. Backend Setup
```bash
cd backend
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run prisma:generate
npm run prisma:migrate
npm run db:seed

# Start development server
npm run dev
```

#### 3. Dashboard Setup
```bash
cd dashboard
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

#### 4. Property App Setup
```bash
cd propertyapp
npm install

# For iOS development
npm run ios

# For Android development
npm run android

# For web development
npm run web
```

#### 5. AI Services Setup
```bash
# Install Python dependencies
cd backend/src/predictive-analytics
pip install -r requirements.txt

# Start AI services
python src/deployment/deploy_model.py
```

### Environment Variables

#### Backend Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/propertyai
MONGODB_URL=mongodb://localhost:27017/propertyai
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# External Services
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
SENDGRID_API_KEY=your-sendgrid-key
STRIPE_SECRET_KEY=your-stripe-key
GOOGLE_API_KEY=your-google-api-key

# AI Services
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
HUGGING_FACE_TOKEN=your-hf-token
```

## Testing Strategy

### Testing Philosophy
- **Test Pyramid**: Unit tests (70%), Integration tests (20%), E2E tests (10%)
- **Test-Driven Development**: Write tests before implementation
- **Continuous Testing**: Automated testing in CI/CD pipeline
- **Performance Testing**: Load testing with k6

### Test Types

#### 1. Unit Tests
- **Backend**: Jest for API endpoints and services
- **Frontend**: React Testing Library for components
- **Mobile**: Jest for React Native components

#### 2. Integration Tests
- **API Testing**: Supertest for REST API endpoints
- **Database Testing**: Test database operations and migrations
- **Service Integration**: Test microservice communication

#### 3. End-to-End Tests
- **Web Application**: Playwright for complete user flows
- **Mobile Application**: Detox for React Native testing
- **API Integration**: Postman/Newman for API testing

#### 4. Performance Tests
- **Load Testing**: k6 scripts for API load testing
- **Stress Testing**: High-load scenario testing
- **Database Performance**: Query optimization testing

### Test Execution
```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:integration   # Integration tests only

# Dashboard tests
cd dashboard
npm test                   # Run all tests
npm run test:e2e          # E2E tests with Playwright

# Property app tests
cd propertyapp
npm test                   # Run all tests
npm run test:coverage     # Coverage report
```

## Deployment Configuration

### Environment Strategy
- **Development**: Local development with Docker Compose
- **Staging**: Cloud-based staging environment
- **Production**: High-availability production deployment

### Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

#### Dashboard Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Kubernetes Deployment

#### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: propertyai-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: propertyai-backend
  template:
    metadata:
      labels:
        app: propertyai-backend
    spec:
      containers:
      - name: backend
        image: propertyai/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: propertyai-secrets
              key: database-url
```

### Cloud Infrastructure (GCP)

#### Core Services
- **GKE**: Google Kubernetes Engine for container orchestration
- **Cloud SQL**: Managed PostgreSQL database
- **Memorystore**: Managed Redis for caching
- **Cloud Storage**: File storage with CloudFront CDN
- **Pub/Sub**: Message queuing and event processing

#### Network Architecture
- **VPC Network**: Isolated network with private subnets
- **Cloud Load Balancer**: Global load balancing with SSL termination
- **Cloud CDN**: Content delivery network for static assets
- **Cloud Armor**: DDoS protection and WAF

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Backend CI/CD
```yaml
name: Backend CI/CD
on:
  push:
    paths: ['backend/**']
    branches: [main, develop]
  pull_request:
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
    - run: npm ci
    - run: npm test
    - run: npm run build
```

#### 2. Dashboard CI/CD
```yaml
name: Dashboard CI/CD
on:
  push:
    paths: ['dashboard/**']
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
    - run: npm ci
    - run: npm test
    - run: npm run build
    - run: npm run test:e2e
```

### Deployment Environments

#### 1. Development Environment
- **Auto-deployment**: Every push to feature branches
- **Database**: Shared development database
- **Resources**: Minimal resource allocation

#### 2. Staging Environment
- **Auto-deployment**: Every push to develop branch
- **Database**: Dedicated staging database
- **Resources**: Production-like resource allocation

#### 3. Production Environment
- **Manual deployment**: Requires approval for main branch
- **Database**: High-availability production database
- **Resources**: Auto-scaling with production-grade security

## Security Framework

### Security Architecture
- **Zero Trust**: Never trust, always verify approach
- **Defense in Depth**: Multiple layers of security controls
- **Principle of Least Privilege**: Minimal necessary permissions
- **Secure by Design**: Security built into the development process

### Authentication & Authorization
- **Multi-Factor Authentication**: TOTP and SMS-based MFA
- **Role-Based Access Control**: Granular permission system
- **OAuth 2.0**: Third-party authentication integration
- **JWT Tokens**: Secure stateless authentication

### Data Security
- **Encryption at Rest**: AES-256 encryption for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Database Encryption**: Transparent data encryption for PostgreSQL
- **Key Management**: Google Cloud Key Management Service

### Application Security
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **XSS Prevention**: Content Security Policy (CSP) headers
- **Rate Limiting**: Per-endpoint rate limiting with user tiers
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options

### Compliance & Auditing
- **Audit Logging**: Comprehensive audit trail for all actions
- **Data Retention**: Configurable data retention policies
- **GDPR Compliance**: Right to be forgotten and data portability
- **SOC 2 Type II**: Security controls and monitoring

## AI/ML Integration

### AI Service Architecture
The AI services are implemented as separate microservices with specialized capabilities:

#### 1. Predictive Analytics Service
- **Technology**: Python with scikit-learn, TensorFlow
- **Models**:
  - Rent optimization model
  - Tenant churn prediction
  - Maintenance prediction
  - Market trend analysis

#### 2. Natural Language Processing Service
- **Technology**: Google Gemini API, Hugging Face transformers
- **Capabilities**:
  - Property description generation
  - Tenant communication analysis
  - Sentiment analysis
  - Chatbot responses

#### 3. Computer Vision Service
- **Technology**: AWS Rekognition, custom CNN models
- **Capabilities**:
  - Property image analysis
  - Damage detection
  - Feature identification
  - Quality assessment

#### 4. Recommendation Engine
- **Technology**: Collaborative filtering, content-based filtering
- **Capabilities**:
  - Property recommendations for tenants
  - Vendor recommendations for managers
  - Pricing recommendations for owners

### AI Model Lifecycle
1. **Training**: Automated model training with new data
2. **Validation**: A/B testing and performance monitoring
3. **Deployment**: Blue-green deployment for model updates
4. **Monitoring**: Real-time model performance tracking
5. **Retraining**: Automatic retraining triggers based on performance

### AI Ethics & Fairness
- **Bias Detection**: Regular bias assessment in AI models
- **Transparency**: Explainable AI for all automated decisions
- **Consent Management**: User consent for AI data processing
- **Fairness Audits**: Regular fairness audits of AI systems

## Monitoring & Observability

### Monitoring Stack
- **Metrics**: Prometheus for metrics collection
- **Tracing**: OpenTelemetry for distributed tracing
- **Logging**: Structured logging with Elasticsearch, Logstash, Kibana (ELK)
- **Alerting**: Grafana alerts with PagerDuty integration

### Key Metrics
- **Business Metrics**: User engagement, conversion rates, revenue
- **Technical Metrics**: API response times, error rates, resource utilization
- **AI Metrics**: Model accuracy, prediction confidence, cost per prediction

### Observability Features
- **Distributed Tracing**: End-to-end request tracking
- **Real-time Dashboards**: Live system health monitoring
- **Error Tracking**: Sentry for error monitoring and reporting
- **Performance Monitoring**: Application Performance Monitoring (APM)

### Alerting Strategy
- **Proactive Alerts**: Predictive alerts based on trends
- **Escalation Policies**: Multi-level escalation based on severity
- **Runbooks**: Automated remediation for common issues
- **On-call Rotation**: 24/7 on-call support with rotation schedules

## Microservices Architecture

### Service Communication Patterns

#### 1. Synchronous Communication
- **Protocol**: REST over HTTP/2
- **Service Discovery**: Consul for service discovery
- **Load Balancing**: Client-side load balancing with circuit breakers
- **Retry Logic**: Exponential backoff with jitter

#### 2. Asynchronous Communication
- **Message Broker**: Redis pub/sub for real-time events
- **Task Queue**: BullMQ for background job processing
- **Event Sourcing**: Event-driven architecture with event sourcing
- **CQRS**: Command Query Responsibility Segregation

### Service Mesh
- **Istio**: Service mesh for microservice communication
- **Traffic Management**: Intelligent routing and load balancing
- **Security**: mTLS for service-to-service communication
- **Observability**: Automatic metrics and tracing

### Data Consistency
- **Eventual Consistency**: Asynchronous data synchronization
- **Saga Pattern**: Distributed transaction management
- **Compensating Transactions**: Rollback mechanisms for failures
- **Distributed Locks**: Redis-based distributed locking

### Service Deployment
- **Blue-Green Deployment**: Zero-downtime deployments
- **Canary Releases**: Gradual rollout with monitoring
- **Feature Flags**: Dynamic feature toggles
- **Rollback Strategy**: Automated rollback on failure detection

---

## Additional Resources

### Documentation Links
- [API Documentation](http://localhost:3001/api-docs)
- [Database Schema](backend/prisma/schema.prisma)
- [Architecture Diagrams](docs/architecture/)
- [Deployment Guides](docs/deployment/)

### Development Tools
- **IDE**: VS Code with recommended extensions
- **Database Client**: Prisma Studio, MongoDB Compass
- **API Testing**: Postman, Insomnia
- **Monitoring**: Grafana dashboards

### Support & Community
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Comprehensive wiki and guides
- **Contributing**: Detailed contributing guidelines

This comprehensive documentation serves as the single source of truth for the PropertyFlow AI platform, providing detailed information for developers, architects, and stakeholders to understand and work with the system effectively.