# PropertyFlow AI

PropertyFlow AI is a comprehensive property management platform that leverages artificial intelligence to streamline operations, enhance communication, and optimize property performance. The platform aims to provide a unified solution for property managers, owners, and tenants with powerful AI-driven features.

## Project Components

- **Backend**: Node.js API server with TypeScript, Express, Prisma, and MongoDB
- **Dashboard**: React frontend for property managers and administrators
- **Property App**: React Native mobile application for tenants and property owners

## CI/CD Pipeline

PropertyFlow AI uses GitHub Actions for continuous integration and deployment:

- **Component-specific workflows**: Triggered when changes are made to specific components
  - Backend: `.github/workflows/backend-ci.yml`
  - Dashboard: `.github/workflows/dashboard-ci.yml`
  - Property App: `.github/workflows/propertyapp-ci.yml`

- **Master CI**: `.github/workflows/master-ci.yml` - Verifies all components on pushes to main branch

- **Integration Tests**: `.github/workflows/integration-tests.yml` - Tests component interactions

- **Security Scan**: `.github/workflows/security-scan.yml` - Regular security analysis

See the [CI/CD documentation](.github/workflows/README.md) for more details.

## Development Setup

1. **Prerequisites**
   - Node.js (v20.x recommended)
   - PostgreSQL
   - MongoDB
   - Redis

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure environment variables
   npm run prisma:generate
   npm run prisma:migrate
   npm run dev
   npm run dev:node
   ```

3. **Dashboard Setup**
   ```bash
   cd dashboard
   npm install
   npm run dev
   npm run dev:dashboard
   ```

4. **Property App Setup**
   ```bash
   cd propertyapp
   npm install
   npm start
   ```

## Testing

Each component has its own test suite:

```bash
# Run backend tests
cd backend
npm test

# Run dashboard tests
cd dashboard
npm test

# Run property app tests
cd propertyapp
npm test
```

## Deployment

The CI/CD pipeline handles deployments automatically when changes are pushed to the main branch.

For manual deployments, refer to the deployment guides in each component's documentation.
