// Simple test script to verify marketing API endpoints
const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3001/api';

async function testMarketingEndpoints() {
  console.log('🧪 Testing Marketing API Endpoints...\n');

  const endpoints = [
    { name: 'Health Check', url: `${API_BASE}/health`, method: 'GET' },
    { name: 'Get Campaigns', url: `${API_BASE}/marketing/campaigns`, method: 'GET' },
    { name: 'Get Analytics Overview', url: `${API_BASE}/marketing/analytics/overview`, method: 'GET' },
    { name: 'Get Promotions', url: `${API_BASE}/marketing/promotions`, method: 'GET' },
    { name: 'Get Syndication Platforms', url: `${API_BASE}/marketing/syndication/platforms`, method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          // Note: In production, you'd need a valid auth token
          'Authorization': 'Bearer test-token'
        }
      });

      const status = response.status;
      const statusText = response.statusText;
      
      if (status === 200 || status === 201) {
        console.log(`✅ ${endpoint.name}: ${status} ${statusText}`);
      } else if (status === 401) {
        console.log(`🔐 ${endpoint.name}: ${status} ${statusText} (Authentication required - expected)`);
      } else {
        console.log(`❌ ${endpoint.name}: ${status} ${statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
    }
  }

  console.log('\n🎉 Marketing API test completed!');
}

testMarketingEndpoints();