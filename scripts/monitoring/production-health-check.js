#!/usr/bin/env node

/**
 * Production Health Check Script for Epic 21
 * Advanced Analytics and AI Insights Features
 *
 * This script performs comprehensive health checks on all Epic 21 services
 * and provides detailed reporting for production monitoring.
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
    services: [
        {
            name: 'Predictive Maintenance API',
            url: 'https://api.propertyai.com/api/v1/maintenance/health',
            timeout: 5000,
            expectedStatus: 200
        },
        {
            name: 'Tenant Churn API',
            url: 'https://api.propertyai.com/api/v1/analytics/churn/health',
            timeout: 5000,
            expectedStatus: 200
        },
        {
            name: 'Market Trends API',
            url: 'https://api.propertyai.com/api/v1/market/health',
            timeout: 5000,
            expectedStatus: 200
        },
        {
            name: 'AI Reporting API',
            url: 'https://api.propertyai.com/api/v1/reporting/health',
            timeout: 5000,
            expectedStatus: 200
        },
        {
            name: 'Risk Assessment API',
            url: 'https://api.propertyai.com/api/v1/risk/health',
            timeout: 5000,
            expectedStatus: 200
        },
        {
            name: 'Frontend Application',
            url: 'https://app.propertyai.com/health',
            timeout: 10000,
            expectedStatus: 200
        }
    ],
    thresholds: {
        maxResponseTime: 2000, // ms
        maxErrorRate: 0.05,    // 5%
        minUptime: 0.99        // 99%
    }
};

// Results storage
let results = {
    timestamp: new Date().toISOString(),
    summary: {
        total: CONFIG.services.length,
        healthy: 0,
        unhealthy: 0,
        totalResponseTime: 0,
        averageResponseTime: 0
    },
    services: [],
    alerts: []
};

/**
 * Make HTTP request with timeout
 */
function makeRequest(service) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const url = new URL(service.url);
        const client = url.protocol === 'https:' ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'GET',
            timeout: service.timeout,
            headers: {
                'User-Agent': 'Epic21-HealthCheck/1.0',
                'Accept': 'application/json'
            }
        };

        const req = client.request(options, (res) => {
            const responseTime = Date.now() - startTime;
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    service: service.name,
                    status: res.statusCode,
                    responseTime,
                    success: res.statusCode === service.expectedStatus,
                    data: data,
                    error: null
                });
            });
        });

        req.on('error', (error) => {
            const responseTime = Date.now() - startTime;
            resolve({
                service: service.name,
                status: null,
                responseTime,
                success: false,
                data: null,
                error: error.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                service: service.name,
                status: null,
                responseTime: service.timeout,
                success: false,
                data: null,
                error: 'Request timeout'
            });
        });

        req.end();
    });
}

/**
 * Check all services
 */
async function checkAllServices() {
    console.log('🔍 Starting Epic 21 Production Health Check...');
    console.log(`📊 Checking ${CONFIG.services.length} services\n`);

    const promises = CONFIG.services.map(service => makeRequest(service));
    const responses = await Promise.all(promises);

    responses.forEach(response => {
        const result = {
            name: response.service,
            status: response.status,
            responseTime: response.responseTime,
            healthy: response.success,
            error: response.error,
            timestamp: new Date().toISOString()
        };

        results.services.push(result);

        if (response.success) {
            results.summary.healthy++;
            results.summary.totalResponseTime += response.responseTime;
            console.log(`✅ ${response.service}: ${response.status} (${response.responseTime}ms)`);
        } else {
            results.summary.unhealthy++;
            console.log(`❌ ${response.service}: ${response.error || 'Status ' + response.status} (${response.responseTime}ms)`);
        }
    });

    // Calculate average response time
    if (results.summary.healthy > 0) {
        results.summary.averageResponseTime = Math.round(
            results.summary.totalResponseTime / results.summary.healthy
        );
    }
}

/**
 * Generate alerts based on thresholds
 */
function generateAlerts() {
    console.log('\n🚨 Checking for alerts...');

    // Response time alert
    if (results.summary.averageResponseTime > CONFIG.thresholds.maxResponseTime) {
        results.alerts.push({
            level: 'WARNING',
            type: 'RESPONSE_TIME',
            message: `Average response time (${results.summary.averageResponseTime}ms) exceeds threshold (${CONFIG.thresholds.maxResponseTime}ms)`,
            services: results.services.filter(s => s.healthy).map(s => s.name)
        });
    }

    // Error rate alert
    const errorRate = results.summary.unhealthy / results.summary.total;
    if (errorRate > CONFIG.thresholds.maxErrorRate) {
        results.alerts.push({
            level: 'CRITICAL',
            type: 'ERROR_RATE',
            message: `Error rate (${(errorRate * 100).toFixed(1)}%) exceeds threshold (${(CONFIG.thresholds.maxErrorRate * 100).toFixed(1)}%)`,
            services: results.services.filter(s => !s.healthy).map(s => s.name)
        });
    }

    // Individual service alerts
    results.services.forEach(service => {
        if (!service.healthy) {
            results.alerts.push({
                level: 'ERROR',
                type: 'SERVICE_DOWN',
                message: `${service.name} is not responding: ${service.error}`,
                service: service.name
            });
        }
    });

    if (results.alerts.length === 0) {
        console.log('✅ No alerts generated - all systems healthy');
    } else {
        results.alerts.forEach(alert => {
            const icon = alert.level === 'CRITICAL' ? '🔴' : alert.level === 'WARNING' ? '🟡' : '🔵';
            console.log(`${icon} ${alert.level}: ${alert.message}`);
        });
    }
}

/**
 * Generate report
 */
function generateReport() {
    const report = {
        ...results,
        thresholds: CONFIG.thresholds,
        overall_health: results.summary.unhealthy === 0 ? 'HEALTHY' : 'DEGRADED'
    };

    console.log('\n📋 Health Check Summary:');
    console.log('='.repeat(50));
    console.log(`Total Services: ${report.summary.total}`);
    console.log(`Healthy: ${report.summary.healthy}`);
    console.log(`Unhealthy: ${report.summary.unhealthy}`);
    console.log(`Average Response Time: ${report.summary.averageResponseTime}ms`);
    console.log(`Overall Health: ${report.overall_health}`);
    console.log(`Alerts: ${report.alerts.length}`);

    if (report.alerts.length > 0) {
        console.log('\nActive Alerts:');
        report.alerts.forEach((alert, index) => {
            console.log(`${index + 1}. ${alert.message}`);
        });
    }

    return report;
}

/**
 * Send notification (placeholder for actual implementation)
 */
function sendNotification(report) {
    // This would integrate with your notification system
    // (Slack, PagerDuty, email, etc.)

    if (report.alerts.length > 0) {
        console.log('\n📤 Sending notifications for alerts...');
        // Implement actual notification sending here
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        await checkAllServices();
        generateAlerts();
        const report = generateReport();
        sendNotification(report);

        // Exit with appropriate code
        const exitCode = results.summary.unhealthy > 0 ? 1 : 0;
        process.exit(exitCode);

    } catch (error) {
        console.error('💥 Health check failed:', error.message);
        process.exit(1);
    }
}

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Epic 21 Production Health Check

USAGE:
    node production-health-check.js [options]

OPTIONS:
    --json          Output results as JSON
    --quiet         Suppress console output
    --help, -h      Show this help message

EXAMPLES:
    node production-health-check.js
    node production-health-check.js --json > health-report.json

DESCRIPTION:
    Performs comprehensive health checks on all Epic 21 services
    and reports any issues or performance concerns.
`);
        process.exit(0);
    }

    if (args.includes('--json')) {
        // Capture output and convert to JSON
        const originalLog = console.log;
        let output = '';

        console.log = (...args) => {
            output += args.join(' ') + '\n';
        };

        main().then(() => {
            console.log = originalLog;
            console.log(JSON.stringify(results, null, 2));
        });
    } else {
        main();
    }
}

module.exports = { checkAllServices, generateAlerts, generateReport };