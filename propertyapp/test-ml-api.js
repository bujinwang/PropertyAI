// Quick test script for ML API integration
const axios = require('axios');

const ML_API_URL = 'http://localhost:5001';

async function testMLAPI() {
  console.log('Testing ML API Integration...\n');

  // Test 1: Health Check
  try {
    console.log('1. Testing Health Endpoint...');
    const health = await axios.get(`${ML_API_URL}/health`);
    console.log('✅ Health check passed');
    console.log('   Status:', health.data.status);
    console.log('   Mode:', health.data.mode);
    console.log('');
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Churn Prediction
  try {
    console.log('2. Testing Churn Prediction...');
    const churnData = {
      propertyId: 'test-prop-1',
      tenantId: 'test-tenant-1',
      features: {
        paymentHistory: [1200, 1200, 1150, 1200, 1100, 1050],
        maintenanceRequests: 8,
        monthsInProperty: 6,
        leaseEndDate: '2025-03-31',
      },
    };
    
    const churnResponse = await axios.post(`${ML_API_URL}/predict/churn`, churnData);
    console.log('✅ Churn prediction successful');
    console.log('   Risk Level:', churnResponse.data.riskLevel);
    console.log('   Probability:', churnResponse.data.churnProbability);
    console.log('   Confidence:', churnResponse.data.confidence);
    console.log('   Factors:', churnResponse.data.factors.length);
    console.log('   Recommendations:', churnResponse.data.recommendations.length);
    console.log('');
  } catch (error) {
    console.log('❌ Churn prediction failed:', error.message);
    if (error.response) {
      console.log('   Error data:', error.response.data);
    }
  }

  // Test 3: Maintenance Prediction
  try {
    console.log('3. Testing Maintenance Prediction...');
    const maintenanceData = {
      propertyId: 'test-prop-1',
      features: {
        propertyAge: 15,
        squareFeet: 1200,
        propertyType: 'apartment',
        maintenanceHistory: [
          { date: '2024-01-15', cost: 450, category: 'plumbing' },
          { date: '2023-11-10', cost: 1200, category: 'hvac' },
        ],
        hvacAge: 12,
        plumbingAge: 15,
        electricalAge: 10,
        roofAge: 8,
      },
    };
    
    const maintenanceResponse = await axios.post(`${ML_API_URL}/predict/maintenance`, maintenanceData);
    console.log('✅ Maintenance prediction successful');
    console.log('   Predicted Cost:', maintenanceResponse.data.predictedCost);
    console.log('   Confidence:', maintenanceResponse.data.confidence);
    console.log('   Breakdown:', maintenanceResponse.data.breakdown ? Object.keys(maintenanceResponse.data.breakdown).length + ' systems' : 'N/A');
    console.log('   Insights:', maintenanceResponse.data.insights ? maintenanceResponse.data.insights.length : 0);
    console.log('');
  } catch (error) {
    console.log('❌ Maintenance prediction failed:', error.message);
    if (error.response) {
      console.log('   Error data:', error.response.data);
    }
  }

  console.log('Testing complete!');
}

testMLAPI().catch(console.error);
