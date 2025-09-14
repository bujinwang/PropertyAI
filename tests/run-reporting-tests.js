#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReportingTestRunner {
  constructor() {
    this.testResults = {
      unit: { passed: 0, failed: 0, total: 0, duration: 0 },
      integration: { passed: 0, failed: 0, total: 0, duration: 0 },
      e2e: { passed: 0, failed: 0, total: 0, duration: 0 },
      performance: { passed: 0, failed: 0, total: 0, duration: 0 },
      security: { passed: 0, failed: 0, total: 0, duration: 0 },
      frontend: { passed: 0, failed: 0, total: 0, duration: 0 }
    };
    this.failedTests = [];
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runTestSuite(testFile, category) {
    const testPath = path.join(__dirname, testFile);

    if (!fs.existsSync(testPath)) {
      this.log(`Test file not found: ${testFile}`, 'warning');
      return;
    }

    this.log(`Running ${category} tests: ${testFile}`);

    const startTime = Date.now();

    try {
      // Run Jest for the specific test file
      const result = execSync(`npx jest ${testPath} --verbose --coverage=false --testTimeout=30000`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse Jest output
      const passed = (result.match(/✓/g) || []).length;
      const failed = (result.match(/✗/g) || []).length;
      const total = passed + failed;

      this.testResults[category].passed += passed;
      this.testResults[category].failed += failed;
      this.testResults[category].total += total;
      this.testResults[category].duration += duration;

      this.log(`${category} tests completed: ${passed} passed, ${failed} failed (${duration}ms)`, 'success');

      if (failed > 0) {
        this.failedTests.push({
          category,
          file: testFile,
          failed,
          total
        });
      }

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.testResults[category].duration += duration;

      // Try to parse error output
      const output = error.stdout || error.stderr || '';
      const failed = (output.match(/✗/g) || []).length || 1; // At least 1 if execution failed
      const passed = (output.match(/✓/g) || []).length;

      this.testResults[category].passed += passed;
      this.testResults[category].failed += failed;
      this.testResults[category].total += (passed + failed) || 1;

      this.failedTests.push({
        category,
        file: testFile,
        error: error.message,
        failed: failed || 1,
        total: (passed + failed) || 1
      });

      this.log(`${category} tests failed: ${error.message}`, 'error');
    }
  }

  async runFrontendTests() {
    this.log('Running frontend component tests');

    const startTime = Date.now();

    try {
      // Run React Testing Library tests
      const result = execSync('cd dashboard && npm test -- --watchAll=false --verbose --coverage=false', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse test results
      const passed = (result.match(/✓/g) || []).length;
      const failed = (result.match(/✗/g) || []).length;
      const total = passed + failed;

      this.testResults.frontend.passed += passed;
      this.testResults.frontend.failed += failed;
      this.testResults.frontend.total += total;
      this.testResults.frontend.duration += duration;

      this.log(`Frontend tests completed: ${passed} passed, ${failed} failed (${duration}ms)`, 'success');

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.testResults.frontend.duration += duration;
      this.testResults.frontend.failed += 1;
      this.testResults.frontend.total += 1;

      this.failedTests.push({
        category: 'frontend',
        file: 'dashboard tests',
        error: error.message
      });

      this.log(`Frontend tests failed: ${error.message}`, 'error');
    }
  }

  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTING SYSTEM TEST RESULTS');
    console.log('='.repeat(80));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    Object.entries(this.testResults).forEach(([category, results]) => {
      if (results.total > 0) {
        const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : '0.0';

        console.log(`\n${category.toUpperCase()} TESTS:`);
        console.log(`  ✅ Passed: ${results.passed}`);
        console.log(`  ❌ Failed: ${results.failed}`);
        console.log(`  📊 Total:  ${results.total}`);
        console.log(`  📈 Pass Rate: ${passRate}%`);
        console.log(`  ⏱️  Duration: ${results.duration}ms`);

        totalPassed += results.passed;
        totalFailed += results.failed;
        totalTests += results.total;
      }
    });

    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

    console.log('\n' + '-'.repeat(80));
    console.log('📈 OVERALL RESULTS:');
    console.log(`  ✅ Total Passed: ${totalPassed}`);
    console.log(`  ❌ Total Failed: ${totalFailed}`);
    console.log(`  📊 Total Tests:  ${totalTests}`);
    console.log(`  📈 Overall Pass Rate: ${overallPassRate}%`);
    console.log(`  ⏱️  Total Duration: ${totalDuration}ms`);
    console.log('-'.repeat(80));

    if (this.failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS DETAILS:');
      this.failedTests.forEach((failure, index) => {
        console.log(`  ${index + 1}. ${failure.category}: ${failure.file}`);
        if (failure.error) {
          console.log(`     Error: ${failure.error}`);
        }
        console.log(`     Failed: ${failure.failed}/${failure.total}`);
      });
    }

    // Generate recommendations
    console.log('\n💡 RECOMMENDATIONS:');

    if (totalFailed > 0) {
      console.log('  • Review and fix failed tests before deployment');
      console.log('  • Check test environment setup and dependencies');
      console.log('  • Verify database connections and test data');
    }

    if (this.testResults.performance.duration > 10000) {
      console.log('  • Performance tests are slow - consider optimization');
    }

    if (this.testResults.security.failed > 0) {
      console.log('  • Security tests failed - address security issues immediately');
    }

    if (overallPassRate >= 90) {
      console.log('  • Excellent test coverage! Ready for deployment');
    } else if (overallPassRate >= 75) {
      console.log('  • Good test coverage, but consider improving before deployment');
    } else {
      console.log('  • Test coverage needs improvement before deployment');
    }

    console.log('\n' + '='.repeat(80));

    return {
      success: totalFailed === 0,
      passRate: parseFloat(overallPassRate),
      totalTests,
      totalPassed,
      totalFailed,
      duration: totalDuration
    };
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive reporting system tests');

    try {
      // Unit Tests
      await this.runTestSuite('reportingService.test.js', 'unit');

      // Integration Tests
      await this.runTestSuite('reportingRoutes.test.js', 'integration');

      // E2E Tests
      await this.runTestSuite('reportingE2E.test.js', 'e2e');

      // Performance Tests
      await this.runTestSuite('reportingPerformance.test.js', 'performance');

      // Security Tests
      await this.runTestSuite('reportingSecurity.test.js', 'security');

      // Frontend Tests
      await this.runFrontendTests();

    } catch (error) {
      this.log(`Test execution failed: ${error.message}`, 'error');
    }

    // Generate final report
    const results = this.generateReport();

    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const testRunner = new ReportingTestRunner();
  testRunner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = ReportingTestRunner;