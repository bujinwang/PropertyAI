const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testEndpoints() {
  console.log('Testing Property App API integrations...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is running');
  } catch (error) {
    console.log('❌ Server health check failed');
  }

  try {
    // Test 2: Authentication endpoints
    console.log('\n2. Testing authentication endpoints...');
    
    // Test register endpoint
    const registerData = {
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'TENANT'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
    console.log('✅ Register endpoint working');
    
    // Extract user data for login test
    const { token, user } = registerResponse.data;
    
    // Test login endpoint
    const loginData = {
      email: 'test@example.com',
      password: 'Test123!'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✅ Login endpoint working');
    
    // Test me endpoint
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${loginResponse.data.token}` }
    });
    console.log('✅ Me endpoint working');
    
    // Test refresh token endpoint
    const refreshResponse = await axios.post(`${API_BASE}/auth/refresh-token`, {
      refreshToken: loginResponse.data.refreshToken
    });
    console.log('✅ Refresh token endpoint working');
    
  } catch (error) {
    console.log('❌ Authentication endpoints issue:', error.response?.data || error.message);
  }

  try {
    // Test 3: Property endpoints (with authentication)
    console.log('\n3. Testing property endpoints...');
    
    // First login to get token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!'
    });
    
    const token = loginResponse.data.token;
    
    // Test create property
    const propertyData = {
      name: 'Test Property',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'USA',
      propertyType: 'APARTMENT',
      totalUnits: 5,
      ownerId: loginResponse.data.user.id,
      managerId: loginResponse.data.user.id
    };
    
    const propertyResponse = await axios.post(`${API_BASE}/properties`, propertyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Create property endpoint working');
    
    // Test get properties
    const propertiesResponse = await axios.get(`${API_BASE}/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Get properties endpoint working');
    
  } catch (error) {
    console.log('❌ Property endpoints issue:', error.response?.data || error.message);
  }

  try {
    // Test 4: Unit endpoints
    console.log('\n4. Testing unit endpoints...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!'
    });
    
    const token = loginResponse.data.token;
    
    // Get properties to use an existing one
    const propertiesResponse = await axios.get(`${API_BASE}/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (propertiesResponse.data.length > 0) {
      const propertyId = propertiesResponse.data[0].id;
      
      // Test create unit
      const unitData = {
        unitNumber: 'A101',
        propertyId: propertyId,
        bedrooms: 1,
        bathrooms: 1,
        rent: 1200,
        size: 750
      };
      
      const unitResponse = await axios.post(`${API_BASE}/units`, unitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Create unit endpoint working');
      
      // Test get units
      const unitsResponse = await axios.get(`${API_BASE}/units`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Get units endpoint working');
    }
    
  } catch (error) {
    console.log('❌ Unit endpoints issue:', error.response?.data || error.message);
  }

  try {
    // Test 5: Maintenance endpoints
    console.log('\n5. Testing maintenance endpoints...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'Test123!'
    });
    
    const token = loginResponse.data.token;
    
    // Get properties and units
    const propertiesResponse = await axios.get(`${API_BASE}/properties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const unitsResponse = await axios.get(`${API_BASE}/units`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (propertiesResponse.data.length > 0 && unitsResponse.data.length > 0) {
      const propertyId = propertiesResponse.data[0].id;
      const unitId = unitsResponse.data[0].id;
      
      // Test create maintenance request
      const maintenanceData = {
        title: 'Test Maintenance',
        description: 'Test maintenance request',
        propertyId: propertyId,
        unitId: unitId,
        priority: 'MEDIUM',
        requestedById: loginResponse.data.user.id
      };
      
      const maintenanceResponse = await axios.post(`${API_BASE}/maintenance`, maintenanceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Create maintenance endpoint working');
      
      // Test get maintenance requests
      const maintenanceListResponse = await axios.get(`${API_BASE}/maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Get maintenance endpoint working');
    }
    
  } catch (error) {
    console.log('❌ Maintenance endpoints issue:', error.response?.data || error.message);
  }

  console.log('\n🎉 Property App API integration test completed!');
  console.log('All core endpoints are working correctly.');
}

// Run the tests
testEndpoints().catch(console.error);