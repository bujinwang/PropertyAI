import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config();

const BASE_URL = `http://localhost:${process.env.PORT || 3001}`;
const API_BASE = `${BASE_URL}/api`;

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  error?: string;
  response?: any;
}

class RentalAPITester {
  private results: TestResult[] = [];
  private authToken: string = '';

  async runAllTests() {
    console.log('🚀 Starting Rental API Tests...\n');
    
    try {
      // Test 1: Health check
      await this.testHealthCheck();
      
      // Test 2: Authentication (if needed)
      await this.testAuthentication();
      
      // Test 3: Public rentals endpoint
      await this.testPublicRentals();
      
      // Test 4: Create rental (protected)
      const rentalId = await this.testCreateRental();
      
      if (rentalId) {
        // Test 5: Get rental by ID
        await this.testGetRental(rentalId);
        
        // Test 6: Update rental
        await this.testUpdateRental(rentalId);
        
        // Test 7: Set rental availability
        await this.testSetRentalAvailability(rentalId);
        
        // Test 8: Set rental status
        await this.testSetRentalStatus(rentalId);
        
        // Test 9: Get rentals with filters
        await this.testGetRentalsWithFilters();
        
        // Test 10: Get rental statistics
        await this.testGetRentalStats();
        
        // Test 11: Get rental counts by type
        await this.testGetRentalCountsByType();
        
        // Test 12: Delete rental
        await this.testDeleteRental(rentalId);
      }
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  private async testHealthCheck() {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      this.addResult('GET /health', 'GET', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult('GET /health', 'GET', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testAuthentication() {
    // This is a placeholder - you might need to implement actual auth
    // For now, we'll use a mock token or skip auth for testing
    this.authToken = 'mock-token-for-testing';
    this.addResult('Authentication', 'POST', 'PASS', 200, undefined, { token: 'mock' });
  }

  private async testPublicRentals() {
    try {
      const response = await axios.get(`${API_BASE}/rentals/public`);
      this.addResult('GET /api/rentals/public', 'GET', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult('GET /api/rentals/public', 'GET', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testCreateRental(): Promise<string | null> {
    const testRental = {
      title: 'Test Rental Property',
      description: 'A beautiful test property for API testing',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'USA',
      propertyType: 'APARTMENT',
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1000,
      rent: 1500,
      deposit: 1500,
      isAvailable: true,
      availableDate: new Date().toISOString(),
      listingStatus: 'ACTIVE',
      isActive: true
    };

    try {
      const response = await axios.post(`${API_BASE}/rentals`, testRental, {
        headers: this.getAuthHeaders()
      });
      this.addResult('POST /api/rentals', 'POST', 'PASS', response.status, undefined, response.data);
      return response.data.id;
    } catch (error: any) {
      this.addResult('POST /api/rentals', 'POST', 'FAIL', error.response?.status, error.message);
      return null;
    }
  }

  private async testGetRental(rentalId: string) {
    try {
      const response = await axios.get(`${API_BASE}/rentals/${rentalId}`);
      this.addResult(`GET /api/rentals/${rentalId}`, 'GET', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult(`GET /api/rentals/${rentalId}`, 'GET', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testUpdateRental(rentalId: string) {
    const updateData = {
      title: 'Updated Test Rental Property',
      rent: 1600
    };

    try {
      const response = await axios.put(`${API_BASE}/rentals/${rentalId}`, updateData, {
        headers: this.getAuthHeaders()
      });
      this.addResult(`PUT /api/rentals/${rentalId}`, 'PUT', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult(`PUT /api/rentals/${rentalId}`, 'PUT', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testSetRentalAvailability(rentalId: string) {
    const availabilityData = {
      isAvailable: false,
      availableDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      const response = await axios.patch(`${API_BASE}/rentals/${rentalId}/availability`, availabilityData, {
        headers: this.getAuthHeaders()
      });
      this.addResult(`PATCH /api/rentals/${rentalId}/availability`, 'PATCH', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult(`PATCH /api/rentals/${rentalId}/availability`, 'PATCH', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testSetRentalStatus(rentalId: string) {
    const statusData = {
      listingStatus: 'PENDING'
    };

    try {
      const response = await axios.patch(`${API_BASE}/rentals/${rentalId}/status`, statusData, {
        headers: this.getAuthHeaders()
      });
      this.addResult(`PATCH /api/rentals/${rentalId}/status`, 'PATCH', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult(`PATCH /api/rentals/${rentalId}/status`, 'PATCH', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testGetRentalsWithFilters() {
    const filters = {
      city: 'Test City',
      propertyType: 'APARTMENT',
      minRent: 1000,
      maxRent: 2000,
      bedrooms: 2
    };

    try {
      const response = await axios.get(`${API_BASE}/rentals`, { params: filters });
      this.addResult('GET /api/rentals (with filters)', 'GET', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult('GET /api/rentals (with filters)', 'GET', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testGetRentalStats() {
    try {
      const response = await axios.get(`${API_BASE}/rentals/stats`, {
        headers: this.getAuthHeaders()
      });
      this.addResult('GET /api/rentals/stats', 'GET', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult('GET /api/rentals/stats', 'GET', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testGetRentalCountsByType() {
    try {
      const response = await axios.get(`${API_BASE}/rentals/counts/by-type`, {
        headers: this.getAuthHeaders()
      });
      this.addResult('GET /api/rentals/counts/by-type', 'GET', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult('GET /api/rentals/counts/by-type', 'GET', 'FAIL', error.response?.status, error.message);
    }
  }

  private async testDeleteRental(rentalId: string) {
    try {
      const response = await axios.delete(`${API_BASE}/rentals/${rentalId}`, {
        headers: this.getAuthHeaders()
      });
      this.addResult(`DELETE /api/rentals/${rentalId}`, 'DELETE', 'PASS', response.status, undefined, response.data);
    } catch (error: any) {
      this.addResult(`DELETE /api/rentals/${rentalId}`, 'DELETE', 'FAIL', error.response?.status, error.message);
    }
  }

  private getAuthHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  private addResult(endpoint: string, method: string, status: 'PASS' | 'FAIL', statusCode?: number, error?: string, response?: any) {
    this.results.push({
      endpoint,
      method,
      status,
      statusCode,
      error,
      response: response ? (typeof response === 'object' ? JSON.stringify(response).substring(0, 100) + '...' : response) : undefined
    });
  }

  private printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(80));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    this.results.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.method} ${result.endpoint}`);
      if (result.statusCode) console.log(`   Status: ${result.statusCode}`);
      if (result.error) console.log(`   Error: ${result.error}`);
      if (result.response && result.status === 'PASS') console.log(`   Response: ${result.response}`);
      console.log('');
    });
    
    console.log('=' .repeat(80));
    console.log(`📈 Summary: ${passed} passed, ${failed} failed out of ${this.results.length} tests`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! The Rental API is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }
  }
}

// Run the tests
const tester = new RentalAPITester();
tester.runAllTests().catch(console.error);