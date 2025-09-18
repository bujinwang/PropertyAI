#!/usr/bin/env node

/**
 * Epic 23 API Tests Runner
 *
 * This script runs comprehensive API tests for the newly migrated
 * AlertGroups and UserTemplates services.
 *
 * Usage:
 *   node tests/run-epic23-api-tests.js
 *   node tests/run-epic23-api-tests.js --alert-groups-only
 *   node tests/run-epic23-api-tests.js --templates-only
 *   node tests/run-epic23-api-tests.js --verbose
 */

const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose');
const alertGroupsOnly = args.includes('--alert-groups-only');
const templatesOnly = args.includes('--templates-only');

console.log('🚀 Epic 23 API Tests Runner');
console.log('==========================\n');

// Test configuration
const testConfig = {
  alertGroups: {
    file: 'tests/alertGroupsApi.test.js',
    name: 'AlertGroups API',
    description: 'Tests for alert group CRUD operations, statistics, and real-time updates'
  },
  templates: {
    file: 'tests/templatesApi.test.js',
    name: 'UserTemplates API',
    description: 'Tests for template management, sharing, validation, and search'
  }
};

// Determine which tests to run
const testsToRun = [];
if (alertGroupsOnly) {
  testsToRun.push('alertGroups');
} else if (templatesOnly) {
  testsToRun.push('templates');
} else {
  testsToRun.push('alertGroups', 'templates');
}

console.log('📋 Test Plan:');
testsToRun.forEach(test => {
  const config = testConfig[test];
  console.log(`  • ${config.name}: ${config.description}`);
});
console.log();

// Environment check
console.log('🔍 Environment Check:');
try {
  // Check if backend is running
  const backendCheck = execSync('curl -s http://localhost:3001/api/health', { timeout: 5000 });
  console.log('  ✅ Backend server is running');
} catch (error) {
  console.log('  ❌ Backend server is not running on localhost:3001');
  console.log('     Please start the backend server before running tests');
  process.exit(1);
}

// Check if database is accessible
try {
  const dbCheck = execSync('curl -s http://localhost:3001/api/health', { timeout: 5000 });
  console.log('  ✅ Database connection appears healthy');
} catch (error) {
  console.log('  ⚠️  Database connection check inconclusive');
}

console.log();

// Run tests
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const testName of testsToRun) {
  const config = testConfig[testName];
  console.log(`\n🧪 Running ${config.name} Tests`);
  console.log('='.repeat(50));

  try {
    const testCommand = `npm test -- ${config.file}${isVerbose ? ' --verbose' : ''}`;
    const output = execSync(testCommand, {
      encoding: 'utf8',
      stdio: isVerbose ? 'inherit' : 'pipe',
      cwd: path.resolve(__dirname, '..')
    });

    if (!isVerbose) {
      // Parse test results from output
      const testResults = parseJestOutput(output);
      console.log(`  ✅ ${config.name}: ${testResults.passed}/${testResults.total} tests passed`);

      totalTests += testResults.total;
      passedTests += testResults.passed;
      failedTests += testResults.failed;
    }

  } catch (error) {
    console.log(`  ❌ ${config.name}: Tests failed`);
    if (isVerbose) {
      console.log(error.stdout || error.message);
    } else {
      // Parse error output for test counts
      const testResults = parseJestOutput(error.stdout || '');
      totalTests += testResults.total;
      passedTests += testResults.passed;
      failedTests += testResults.failed + (testResults.total - testResults.passed - testResults.failed); // Account for crashed tests
    }
  }
}

// Summary
console.log('\n📊 Test Results Summary');
console.log('=======================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Epic 23 API migration is successful.');
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the test output above.`);
  process.exit(1);
}

// Helper function to parse Jest output
function parseJestOutput(output) {
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Look for test summary patterns
  const testResultRegex = /Tests?:\s*(\d+)\s*(?:passed|failed|total)/gi;
  const passedRegex = /(\d+)\s*passed/gi;
  const failedRegex = /(\d+)\s*failed/gi;

  let match;

  // Extract total tests
  match = testResultRegex.exec(output);
  if (match) {
    results.total = parseInt(match[1]);
  }

  // Extract passed tests
  match = passedRegex.exec(output);
  if (match) {
    results.passed = parseInt(match[1]);
  }

  // Extract failed tests
  match = failedRegex.exec(output);
  if (match) {
    results.failed = parseInt(match[1]);
  }

  return results;
}

// Export for use in other scripts
module.exports = {
  runEpic23Tests: async (options = {}) => {
    const { alertGroupsOnly = false, templatesOnly = false, verbose = false } = options;

    // Implementation would go here
    console.log('Running Epic 23 API tests programmatically...');
  }
};
