const axios = require('axios');

async function testPropertiesApp() {
  try {
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@propertyai.com',
      password: 'Password123!'
    });
    
    const token = loginResponse.data.token;
    
    // Test properties endpoint (what the app will call)
    const propertiesResponse = await axios.get('http://localhost:5001/api/rentals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Properties endpoint working correctly!');
    console.log(`Found ${propertiesResponse.data.length} properties:`);
    propertiesResponse.data.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.name} - ${prop.address}, ${prop.city}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPropertiesApp();