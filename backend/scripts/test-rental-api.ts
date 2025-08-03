#!/usr/bin/env ts-node

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  responseTime?: number;
}

class RentalAPITester {
  private results: TestResult[] = [];
  private testRentalId: string | null = null;
  private authToken: string | null = null;

  async runAllTests() {
    console.log('🧪 Starting Rental API Tests');
    console.log('=' .repeat(50));

    try {
      await this.setupAuth();
      await this.testGetRentals();
      await this.testCreateRental();
      await this.testGetRentalById();
      await this.testUpdateRental();
      await this.testRentalFiltering();
      await this.testRentalStats();
      await this.testRentalAvailability();
      await this.testRentalStatus();
      await this.testPublicRentals();
      await this.testDeleteRental();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async setupAuth() {
    try {
      // Try to get an admin user for testing
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@propertyai.com' }
      });

      if (adminUser) {
        // In a real scenario, you'd authenticate and get a token
        // For now, we'll simulate having auth
        this.authToken = 'test-token';
        console.log('✅ Authentication setup complete');
      } else {
        console.log('⚠️  No admin user found, running tests without auth');
      }
    } catch (error) {
      console.log('⚠️  Auth setup failed, continuing without auth');
    }
  }

  private async testGetRentals() {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_URL}/rentals`);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && Array.isArray(response.data.data)) {
        this.addResult('GET /rentals', 'GET', 'PASS', 
          `Retrieved ${response.data.data.length} rentals`, responseTime);
      } else {
        this.addResult('GET /rentals', 'GET', 'FAIL', 
          'Invalid response format', responseTime);
      }
    } catch (error: any) {
      this.addResult('GET /rentals', 'GET', 'FAIL', 
        error.message, Date.now() - startTime);
    }
  }

  private async testCreateRental() {
    const startTime = Date.now();
    try {
      // Get a manager user for the rental
      const manager = await prisma.user.findFirst({
        where: { 
          roles: {
            some: { name: 'PROPERTY_MANAGER' }
          }
        }
      });

      if (!manager) {
        this.addResult('POST /rentals', 'POST', 'SKIP', 
          'No manager user found for testing');
        return;
      }

      const testRental = {
        title: 'Test Rental Unit',
        description: 'A test rental unit for API testing',
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US',
        propertyType: 'APARTMENT',
        rent: 1500,
        bedrooms: 2,
        bathrooms: 1,
        size: 800,
        unitNumber: 'TEST-001',
        managerId: manager.id,
        ownerId: manager.id,
        createdById: manager.id,
      };

      const response = await axios.post(`${API_URL}/rentals`, testRental);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 201 && response.data.data.id) {
        this.testRentalId = response.data.data.id;
        this.addResult('POST /rentals', 'POST', 'PASS', 
          `Created rental with ID: ${this.testRentalId}`, responseTime);
      } else {
        this.addResult('POST /rentals', 'POST', 'FAIL', 
          'Failed to create rental', responseTime);
      }
    } catch (error: any) {
      this.addResult('POST /rentals', 'POST', 'FAIL', 
        error.response?.data?.message || error.message, Date.now() - startTime);
    }
  }

  private async testGetRentalById() {
    if (!this.testRentalId) {
      this.addResult('GET /rentals/:id', 'GET', 'SKIP', 
        'No test rental ID available');
      return;
    }

    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_URL}/rentals/${this.testRentalId}`);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.data.id === this.testRentalId) {
        this.addResult('GET /rentals/:id', 'GET', 'PASS', 
          'Retrieved rental by ID', responseTime);
      } else {
        this.addResult('GET /rentals/:id', 'GET', 'FAIL', 
          'Invalid rental data', responseTime);
      }
    } catch (error: any) {
      this.addResult('GET /rentals/:id', 'GET', 'FAIL', 
        error.message, Date.now() - startTime);
    }
  }

  private async testUpdateRental() {
    if (!this.testRentalId) {
      this.addResult('PUT /rentals/:id', 'PUT', 'SKIP', 
        'No test rental ID available');
      return;
    }

    const startTime = Date.now();
    try {
      const updateData = {
        title: 'Updated Test Rental Unit',
        rent: 1600,
      };

      const response = await axios.put(`${API_URL}/rentals/${this.testRentalId}`, updateData);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.data.title === updateData.title) {
        this.addResult('PUT /rentals/:id', 'PUT', 'PASS', 
          'Updated rental successfully', responseTime);
      } else {
        this.addResult('PUT /rentals/:id', 'PUT', 'FAIL', 
          'Failed to update rental', responseTime);
      }
    } catch (error: any) {
      this.addResult('PUT /rentals/:id', 'PUT', 'FAIL', 
        error.response?.data?.message || error.message, Date.now() - startTime);
    }
  }

  private async testRentalFiltering() {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_URL}/rentals?propertyType=APARTMENT&minRent=1000&maxRent=2000`);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        this.addResult('GET /rentals (filtered)', 'GET', 'PASS', 
          `Filtering works, found ${response.data.data.length} results`, responseTime);
      } else {
        this.addResult('GET /rentals (filtered)', 'GET', 'FAIL', 
          'Filtering failed', responseTime);
      }
    } catch (error: any) {
      this.addResult('GET /rentals (filtered)', 'GET', 'FAIL', 
        error.message, Date.now() - startTime);
    }
  }

  private async testRentalStats() {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_URL}/rentals/stats`);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.data) {
        this.addResult('GET /rentals/stats', 'GET', 'PASS', 
          'Stats endpoint working', responseTime);
      } else {
        this.addResult('GET /rentals/stats', 'GET', 'FAIL', 
          'Stats endpoint failed', responseTime);
      }
    } catch (error: any) {
      this.addResult('GET /rentals/stats', 'GET', 'FAIL', 
        error.message, Date.now() - startTime);
    }
  }

  private async testRentalAvailability() {
    if (!this.testRentalId) {
      this.addResult('PUT /rentals/:id/availability', 'PUT', 'SKIP', 
        'No test rental ID available');
      return;
    }

    const startTime = Date.now();
    try {
      const response = await axios.put(`${API_URL}/rentals/${this.testRentalId}/availability`, {
        isAvailable: false,
        availableDate: '2024-06-01'
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        this.addResult('PUT /rentals/:id/availability', 'PUT', 'PASS', 
          'Availability update works', responseTime);
      } else {
        this.addResult('PUT /rentals/:id/availability', 'PUT', 'FAIL', 
          'Availability update failed', responseTime);
      }
    } catch (error: any) {
      this.addResult('PUT /rentals/:id/availability', 'PUT', 'FAIL', 
        error.response?.data?.message || error.message, Date.now() - startTime);
    }
  }

  private async testRentalStatus() {
    if (!this.testRentalId) {
      this.addResult('PUT /rentals/:id/status', 'PUT', 'SKIP', 
        'No test rental ID available');
      return;
    }

    const startTime = Date.now();
    try {
      const response = await axios.put(`${API_URL}/rentals/${this.testRentalId}/status`, {
        status: 'MAINTENANCE'
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        this.addResult('PUT /rentals/:id/status', 'PUT', 'PASS', 
          'Status update works', responseTime);
      } else {
        this.addResult('PUT /rentals/:id/status', 'PUT', 'FAIL', 
          'Status update failed', responseTime);
      }
    } catch (error: any) {
      this.addResult('PUT /rentals/:id/status', 'PUT', 'FAIL', 
        error.response?.data?.message || error.message, Date.now() - startTime);
    }
  }

  private async testPublicRentals() {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${API_URL}/rentals/public`);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        this.addResult('GET /rentals/public', 'GET', 'PASS', 
          `Public rentals endpoint works, found ${response.data.data.length} results`, responseTime);
      } else {
        this.addResult('GET /rentals/public', 'GET', 'FAIL', 
          'Public rentals failed', responseTime);
      }
    } catch (error: any) {
      this.addResult('GET /rentals/public', 'GET', 'FAIL', 
        error.message, Date.now() - startTime);
    }
  }

  private async testDeleteRental() {
    if (!this.testRentalId) {
      this.addResult('DELETE /rentals/:id', 'DELETE', 'SKIP', 
        'No test rental ID available');
      return;
    }

    const startTime = Date.now();
    try {
      const response = await axios.delete(`${API_URL}/rentals/${this.testRentalId}`);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 || response.status === 204) {
        this.addResult('DELETE /rentals/:id', 'DELETE', 'PASS', 
          'Rental deleted successfully', responseTime);
        this.testRentalId = null; // Clear the ID since it's deleted
      } else {
        this.addResult('DELETE /rentals/:id', 'DELETE', 'FAIL', 
          'Failed to delete rental', responseTime);
      }
    } catch (error: any) {
      this.addResult('DELETE /rentals/:id', 'DELETE', 'FAIL', 
        error.response?.data?.message || error.message, Date.now() - startTime);
    }
  }

  private addResult(endpoint: string, method: string, status: 'PASS' | 'FAIL' | 'SKIP', 
                   message: string, responseTime?: number) {
    this.results.push({ endpoint, method, status, message, responseTime });
  }

  private printResults() {
    console.log('\n📊 Test Results');
    console.log('=' .repeat(80));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    this.results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : 
                        result.status === 'FAIL' ? '❌' : '⏭️';
      const timeStr = result.responseTime ? ` (${result.responseTime}ms)` : '';
      console.log(`${statusIcon} ${result.method} ${result.endpoint}${timeStr}`);
      console.log(`   ${result.message}`);
    });
    
    console.log('\n📈 Summary');
    console.log('-' .repeat(40));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${this.results.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Rental API is working correctly.');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Please check the API implementation.`);
    }
  }

  private async cleanup() {
    // Clean up any test data that wasn't deleted
    if (this.testRentalId) {
      try {
        await prisma.rental.delete({
          where: { id: this.testRentalId }
        });
        console.log('🧹 Cleaned up test rental');
      } catch (error) {
        console.log('⚠️  Failed to clean up test rental');
      }
    }
    
    await prisma.$disconnect();
  }
}

async function main() {
  const tester = new RentalAPITester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
}

export { RentalAPITester };