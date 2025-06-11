# PropertyAI CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and continuous deployment of the PropertyAI application components.

## Workflow Structure

The CI/CD system is divided into several workflows:

1. **Component-specific workflows** - Triggered when changes are made to a specific component:
   - `backend-ci.yml`: For the Node.js backend application
   - `dashboard-ci.yml`: For the React dashboard frontend
   - `propertyapp-ci.yml`: For the React Native mobile application

2. **Master workflow** - `master-ci.yml`: Runs on any push to the main branch or pull request targeting main, verifying all components together.

## Workflow Details

### Backend CI/CD (`backend-ci.yml`)

- **Trigger**: Changes to files in the `backend/` directory
- **Jobs**:
  - **Build**: Installs dependencies, runs linting, tests, and builds the application
  - **Deploy**: Deploys the backend to the production environment (only on push to main)

### Dashboard CI/CD (`dashboard-ci.yml`)

- **Trigger**: Changes to files in the `dashboard/` directory
- **Jobs**:
  - **Build**: Installs dependencies and builds the React application
  - **Deploy**: Deploys the dashboard to the production environment (only on push to main)

### Property App CI/CD (`propertyapp-ci.yml`)

- **Trigger**: Changes to files in the `propertyapp/` directory
- **Jobs**:
  - **Build**: Installs dependencies, runs linting and tests
  - **Deploy**: Prepares the mobile app for deployment (only on push to main)

### Master CI (`master-ci.yml`)

- **Trigger**: Any push to main or pull request targeting main
- **Jobs**:
  - **verify-backend**: Runs backend verification
  - **verify-dashboard**: Runs dashboard verification
  - **verify-propertyapp**: Runs mobile app verification
  - **notify-success**: Runs when all verification jobs pass successfully

## Environment Secrets

To enable deployments, the following secrets should be configured in the GitHub repository:

- **Backend Deployment**:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - Other service-specific credentials as needed

- **Dashboard Deployment**:
  - Deployment target credentials (e.g., `NETLIFY_AUTH_TOKEN` or AWS S3 credentials)

- **Mobile App Deployment**:
  - `EXPO_TOKEN` for Expo deployments
  - App Store Connect / Google Play Store credentials if needed

## Local Development

You can use these workflows as a reference for local development practices:

1. Always run linting before committing: `npm run lint`
2. Ensure tests pass: `npm test`
3. For backend changes, make sure Prisma schema is properly migrated and generated

## Future Improvements

1. Add code coverage reporting to test jobs
2. Implement automated dependency updates with Dependabot
3. Add performance benchmarking to ensure new changes maintain or improve performance
4. Set up staging deployments for features in development
5. Implement database migration validation in CI pipeline
6. Add end-to-end testing with Cypress or similar tools 