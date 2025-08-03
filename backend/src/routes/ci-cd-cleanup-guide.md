# CI/CD Pipeline Cleanup Guide

## Legacy Route Test Removal

### Tests to Remove
The following test files and test cases should be removed from CI/CD pipelines:

#### 1. Property Controller Tests
- `propertyController.test.ts`
- Test cases for `/api/properties/*` endpoints
- Property model validation tests

#### 2. Unit Controller Tests
- `unitController.test.ts`
- Test cases for `/api/units/*` endpoints
- Unit model validation tests

#### 3. Listing Controller Tests
- `listingController.test.ts`
- Test cases for `/api/listings/*` endpoints
- Listing model validation tests

### Tests to Keep/Update
- `rentalController.test.ts` - Updated to cover all consolidated functionality
- Integration tests that use the new `/api/rentals` endpoints
- Migration helper tests in `migration-helpers.test.ts`

### Pipeline Configuration Updates

#### Jest Configuration
Update `jest.config.js` to exclude legacy test files:
```javascript
module.exports = {
  // ... existing config
  testPathIgnorePatterns: [
    '/node_modules/',
    '/legacy-tests/', // Move old tests here instead of deleting
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/controllers/propertyController.ts', // Deprecated
    '!src/controllers/unitController.ts',     // Deprecated
    '!src/controllers/listingController.ts', // Deprecated
    '!src/services/propertyService.ts',      // Deprecated
    '!src/services/unitService.ts',          // Deprecated
    '!src/services/listingService.ts',       // Deprecated
  ]
};
```

#### GitHub Actions (if applicable)
Update workflow files to:
1. Remove legacy API endpoint health checks
2. Update integration test endpoints to use `/api/rentals`
3. Remove legacy database seeding for Property/Unit/Listing models

#### Test Environment Setup
Update test database seeding to:
1. Use Rental model instead of Property/Unit/Listing
2. Remove legacy model factories
3. Update test data generators

### Verification Steps
1. Run full test suite to ensure no broken tests
2. Verify integration tests pass with new endpoints
3. Check that coverage reports exclude deprecated files
4. Validate that deployment tests use correct endpoints

### Rollback Plan
If issues are discovered:
1. Legacy controller stubs can be temporarily restored
2. Legacy routes can be re-enabled in `routes/index.ts`
3. Test files are preserved in `/legacy-tests/` directory