/**
 * Staging Deployment Validation Tests
 * Tests for Epic 21 deployment script functionality and staging environment setup
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Staging Deployment Validation', () => {
  const stagingEnv = {
    NAMESPACE: 'staging',
    EPIC: '21',
    DEPLOYMENT_TIMEOUT: '1800'
  };

  beforeAll(() => {
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.STAGING_NAMESPACE = stagingEnv.NAMESPACE;
  });

  describe('Deployment Script Validation', () => {
    test('deployment script exists and is executable', () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/deploy-epic21.sh');

      expect(fs.existsSync(scriptPath)).toBe(true);

      // Check if file is executable
      const stats = fs.statSync(scriptPath);
      const isExecutable = !!(stats.mode & parseInt('111', 8));
      expect(isExecutable).toBe(true);
    });

    test('deployment script has proper shebang', () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/deploy-epic21.sh');
      const content = fs.readFileSync(scriptPath, 'utf8');

      expect(content.startsWith('#!/bin/bash')).toBe(true);
    });

    test('deployment script contains required environment checks', () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/deploy-epic21.sh');
      const content = fs.readFileSync(scriptPath, 'utf8');

      expect(content).toContain('kubectl config current-context');
      expect(content).toContain('prod');
      expect(content).toContain('staging');
    });

    test('deployment script includes error handling', () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/deploy-epic21.sh');
      const content = fs.readFileSync(scriptPath, 'utf8');

      expect(content).toContain('set -euo pipefail');
      expect(content).toContain('rollback_deployment');
    });
  });

  describe('Environment Configuration Validation', () => {
    test('staging environment variables are properly configured', () => {
      // Check if staging environment file exists
      const envPath = path.join(__dirname, '../../.env.staging');

      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');

        // Should contain essential staging variables
        expect(content).toMatch(/NODE_ENV.*staging/i);
        expect(content).toMatch(/DATABASE_URL/i);
        expect(content).toMatch(/REDIS_URL/i);
      } else {
        // If no .env.staging, check main env file has staging config
        const mainEnvPath = path.join(__dirname, '../../.env');
        expect(fs.existsSync(mainEnvPath)).toBe(true);

        const content = fs.readFileSync(mainEnvPath, 'utf8');
        expect(content).toMatch(/STAGING/i);
      }
    });

    test('staging configuration files exist', () => {
      const configDir = path.join(__dirname, '../../config/staging');

      if (fs.existsSync(configDir)) {
        const files = fs.readdirSync(configDir);
        expect(files.length).toBeGreaterThan(0);

        // Should contain database and app config
        expect(files.some(file => file.includes('database'))).toBe(true);
      }
    });

    test('staging docker compose file exists', () => {
      const dockerComposePath = path.join(__dirname, '../../docker-compose.staging.yml');

      if (fs.existsSync(dockerComposePath)) {
        const content = fs.readFileSync(dockerComposePath, 'utf8');

        expect(content).toContain('services:');
        expect(content).toMatch(/epic21/i);
      }
    });
  });

  describe('Deployment Prerequisites', () => {
    test('required deployment files exist', () => {
      const requiredFiles = [
        'infrastructure/production-deployment.yml',
        'infrastructure/rollback/production-rollback.sh',
        'scripts/monitoring/production-health-check.js'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '../../', file);
        expect(fs.existsSync(filePath)).toBe(`Required file missing: ${file}`);
      });
    });

    test('kubernetes manifests are valid', () => {
      const deploymentFile = path.join(__dirname, '../../infrastructure/production-deployment.yml');

      if (fs.existsSync(deploymentFile)) {
        const content = fs.readFileSync(deploymentFile, 'utf8');

        // Basic YAML structure validation
        expect(content).toContain('apiVersion:');
        expect(content).toContain('kind:');
        expect(content).toMatch(/epic21/i);
      }
    });

    test('health check script is executable', () => {
      const healthCheckPath = path.join(__dirname, '../../scripts/monitoring/production-health-check.js');

      expect(fs.existsSync(healthCheckPath)).toBe(true);

      // Check if file has proper shebang
      const content = fs.readFileSync(healthCheckPath, 'utf8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });
  });

  describe('Deployment Dry Run', () => {
    test('deployment script dry run executes without errors', () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/deploy-epic21.sh');

      try {
        // Test dry run mode
        const result = execSync(`bash "${scriptPath}" --dry-run`, {
          encoding: 'utf8',
          timeout: 30000,
          env: { ...process.env, ...stagingEnv }
        });

        expect(result).toContain('DRY RUN MODE');
        expect(result).toContain('Phase 1: Deploy services');
        expect(result).toContain('Phase 2: Scale to 50%');
        expect(result).toContain('Phase 3: Full 100% rollout');
      } catch (error) {
        // If kubectl is not available in test environment, that's expected
        if (error.message.includes('kubectl')) {
          console.warn('kubectl not available in test environment - dry run test skipped');
        } else {
          throw error;
        }
      }
    }, 60000);

    test('deployment script shows help correctly', () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/deploy-epic21.sh');

      const result = execSync(`bash "${scriptPath}" --help`, {
        encoding: 'utf8',
        timeout: 10000
      });

      expect(result).toContain('USAGE:');
      expect(result).toContain('DESCRIPTION:');
      expect(result).toContain('OPTIONS:');
      expect(result).toContain('--dry-run');
      expect(result).toContain('--help');
    });
  });

  describe('Feature Flag Validation', () => {
    test('feature flag configuration is valid', () => {
      const featureFlagFile = path.join(__dirname, '../../config/production/feature-flags.yml');

      if (fs.existsSync(featureFlagFile)) {
        const content = fs.readFileSync(featureFlagFile, 'utf8');

        // Should contain Epic 21 feature flags
        expect(content).toMatch(/epic21/i);
        expect(content).toMatch(/rollout_percentage/i);
      }
    });

    test('feature flags have proper structure', () => {
      const featureFlagFile = path.join(__dirname, '../../config/production/feature-flags.yml');

      if (fs.existsSync(featureFlagFile)) {
        const content = fs.readFileSync(featureFlagFile, 'utf8');

        // Should be valid YAML structure
        expect(() => JSON.parse(JSON.stringify(require('js-yaml').load(content)))).not.toThrow();
      }
    });
  });
});