# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

PropertyFlow AI is a comprehensive property management platform with three main components:

- **Backend**: Node.js/TypeScript API server with Express, Prisma ORM, PostgreSQL, MongoDB, and Redis
- **Dashboard**: React web application for property managers and administrators (Vite build)
- **Property App**: React Native mobile application for tenants and property owners (Expo)

## Key Technologies

**Backend Stack:**
- Node.js 20.x, TypeScript, Express.js
- Database: PostgreSQL (Prisma ORM) + MongoDB (Mongoose)
- Cache: Redis
- AI/ML: Python integration for predictive analytics, Google Gemini, Hugging Face
- External APIs: AWS S3, Google Cloud Speech, Twilio, Stripe, DocuSign
- Queue: BullMQ for background jobs
- Monitoring: OpenTelemetry, Prometheus

**Frontend Stack:**
- Dashboard: React 19, TypeScript, Vite, Material-UI, Chart.js
- Property App: React Native 0.73, Expo SDK 50, React Navigation

## Quick Commands

### Backend
```bash
cd backend
npm install
npm run dev          # Start dev server (Node + Python)
npm run build        # Build TypeScript
tsc --watch          # Watch mode for development
npm test             # Run Jest tests
npm run lint         # ESLint check
npm run prisma:migrate  # Run database migrations
npm run prisma:studio  # Open Prisma Studio
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset and reseed database
```

### Dashboard
```bash
cd dashboard
npm install
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run React Testing Library tests
```

### Property App
```bash
cd propertyapp
npm install
npm start            # Start Expo dev server
npm run android      # Run on Android emulator/device
npm run ios          # Run on iOS simulator/device
npm run web          # Run web version
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint issues
npm test             # Run Jest tests
npm run test:coverage # Run tests with coverage
```

## Development Setup

1. **Prerequisites**: Node.js 20.x, PostgreSQL, MongoDB, Redis
2. **Environment Setup**: Copy `.env.example` to `.env` in backend and configure
3. **Database**: Run `npm run prisma:migrate` and `npm run db:seed` for initial setup
4. **Start Services**: Run backend, dashboard, and property app in separate terminals

## Core Architecture Patterns

- **Microservices Architecture**: Modular services for AI, payments, notifications
- **Event-Driven**: Pub/Sub pattern with Redis/BullMQ for async processing
- **API Design**: RESTful APIs with comprehensive OpenAPI documentation
- **Security**: JWT authentication, MFA, role-based access control, rate limiting
- **Monitoring**: OpenTelemetry tracing, Prometheus metrics, structured logging
- **Testing**: Unit tests with Jest, integration tests, load tests

## Key Directories

**Backend (`/backend/`):**
- `src/controllers/` - REST API controllers
- `src/services/` - Business logic services
- `src/routes/` - Express route definitions
- `src/models/` - Prisma schema and MongoDB models
- `src/predictive-analytics/` - Python ML services
- `prisma/` - Database schema and migrations

**Dashboard (`/dashboard/`):**
- `src/pages/` - Page components
- `src/components/` - Reusable UI components
- `src/services/` - API service layers
- `src/design-system/` - Design system components

**Property App (`/propertyapp/`):**
- `src/screens/` - Mobile app screens
- `src/components/` - React Native components
- `src/navigation/` - React Navigation setup
- `src/services/` - API and utility services

## Database Operations

- **PostgreSQL**: Primary database via Prisma ORM
- **MongoDB**: Secondary storage for documents, logs, unstructured data
- **Migrations**: Use Prisma migrations for schema changes
- **Seeding**: Use `npm run db:seed` for development data
- **Studio**: Use `npm run prisma:studio` for database management GUI

## Testing Strategy

- **Unit Tests**: Jest for backend services and React components
- **Integration Tests**: API endpoint testing with supertest
- **E2E Tests**: React Testing Library for frontend, Detox for mobile
- **Load Tests**: k6 scripts for performance testing
- **Security Tests**: OWASP ZAP for security scanning

## Deployment

- **CI/CD**: GitHub Actions workflows for each component
- **Docker**: Containerized deployment with docker-compose
- **Infrastructure**: Terraform for cloud infrastructure (GCP)
- **Monitoring**: Prometheus + Grafana for metrics and alerting