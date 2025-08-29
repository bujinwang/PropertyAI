# Contributing to PropertyAI

Thank you for your interest in contributing to PropertyAI! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your feature or bugfix
5. Make your changes
6. Test your changes
7. Submit a pull request

## Development Setup

### Prerequisites

- Node.js (v20.x recommended)
- PostgreSQL (v13+)
- MongoDB (v4.4+)
- Redis (v7+)
- Docker (optional, for containerized development)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/PropertyAI.git
   cd PropertyAI
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up databases:**
   ```bash
   # PostgreSQL setup
   npm run prisma:generate
   npm run prisma:migrate

   # MongoDB setup (optional seed data)
   npm run seed:mongodb
   ```

5. **Start development servers:**
   ```bash
   # Start all services
   npm run dev

   # Or start individually
   npm run dev:backend
   npm run dev:dashboard
   npm run dev:contractor
   ```

## Project Structure

```
PropertyAI/
├── backend/           # Node.js API server
├── dashboard/         # React web dashboard
├── ContractorApp/     # React Native contractor app
├── propertyapp/       # React Native tenant app
├── scripts/           # Utility scripts
└── docs/              # Documentation
```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/PropertyAI/PropertyAI/issues)
2. If not, create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, etc.)

### Suggesting Features

1. Check [Issues](https://github.com/PropertyAI/PropertyAI/issues) for existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Making Changes

1. **Choose an issue** from the [Issues](https://github.com/PropertyAI/PropertyAI/issues) page
2. **Comment** on the issue to let others know you're working on it
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/issue-number-short-description
   ```

## Pull Request Process

1. **Ensure your code follows our coding standards**
2. **Add/update tests** for your changes
3. **Update documentation** if necessary
4. **Run the test suite**:
   ```bash
   npm test
   npm run lint
   ```
5. **Commit your changes** with clear, descriptive messages
6. **Push to your fork** and create a pull request
7. **Fill out the PR template** completely
8. **Wait for review** and address any feedback

### PR Requirements

- [ ] Code follows the style guidelines
- [ ] Self-review of the code completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Documentation updated where necessary
- [ ] Tests added for new functionality
- [ ] All tests pass
- [ ] No breaking changes (or clearly documented)

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Prefer async/await over promises
- Use descriptive variable and function names

### File Organization

- Group related functionality in modules
- Use barrel exports (index.ts files)
- Keep files focused and under 500 lines
- Use consistent naming conventions

### API Design

- Follow RESTful principles
- Use consistent error handling
- Include proper HTTP status codes
- Document all endpoints with OpenAPI

## Testing

- Write unit tests for new functionality
- Use Jest for backend testing
- Use React Testing Library for frontend tests
- Maintain test coverage above 80%
- Test both success and error scenarios

### Running Tests

```bash
# Run all tests
npm test

# Run specific component tests
npm run test:backend
npm run test:dashboard
npm run test:contractor

# Run with coverage
npm run test:coverage
```

## Documentation

- Update README.md for significant changes
- Document new APIs in OpenAPI format
- Add JSDoc comments for public functions
- Update changelog for releases

## Questions?

If you have questions, please:
1. Check existing documentation
2. Search closed issues
3. Ask in our [Discussions](https://github.com/PropertyAI/PropertyAI/discussions)
4. Create an issue if needed

Thank you for contributing to PropertyAI! 🚀