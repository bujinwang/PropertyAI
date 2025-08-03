const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@propertyai.com',
      password: 'Password123!'
    });
    
    console.log('Login successful:', response.data);
    
    // Test properties endpoint with token
    const token = response.data.token;
    const propertiesResponse = await axios.get('http://localhost:5001/api/rentals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Properties found:', propertiesResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin();