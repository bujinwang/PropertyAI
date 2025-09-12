import { dashboardService } from '../dashboardService';
import api from '../api';

// Mock the API module
jest.mock('../api', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as any;

describe('dashboardService - Lease methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLeases', () => {
    it('should fetch leases with pagination and search', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            tenantId: 'tenant1',
            unitId: 'unit1',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            rentAmount: 1500,
            paymentFrequency: 'monthly',
            status: 'active',
            tenantName: 'John Doe',
            unitAddress: '123 Main St',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const result = await dashboardService.getLeases(1, 10, 'John');

      expect(mockApi.get).toHaveBeenCalledWith('/leases?page=1&limit=10&search=John');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch leases without search parameter when not provided', async () => {
      const mockResponse = {
        data: [],
        total: 0,
      };

      mockApi.get.mockResolvedValue(mockResponse);

      await dashboardService.getLeases(1, 10);

      expect(mockApi.get).toHaveBeenCalledWith('/leases?page=1&limit=10');
    });
  });

  describe('createLease', () => {
    it('should create a new lease', async () => {
      const leaseData = {
        tenantId: 'tenant1',
        unitId: 'unit1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        rentAmount: 1500,
        paymentFrequency: 'monthly' as const,
        status: 'active' as const,
      };

      const mockResponse = {
        id: 'lease1',
        ...leaseData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const result = await dashboardService.createLease(leaseData);

      expect(mockApi.post).toHaveBeenCalledWith('/leases', leaseData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateLease', () => {
    it('should update an existing lease', async () => {
      const leaseId = 'lease1';
      const updateData = {
        rentAmount: 1600,
        status: 'renewed' as const,
      };

      const mockResponse = {
        id: leaseId,
        tenantId: 'tenant1',
        unitId: 'unit1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        rentAmount: 1600,
        paymentFrequency: 'monthly' as const,
        status: 'renewed' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockApi.put.mockResolvedValue(mockResponse);

      const result = await dashboardService.updateLease(leaseId, updateData);

      expect(mockApi.put).toHaveBeenCalledWith(`/leases/${leaseId}`, updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteLease', () => {
    it('should delete a lease', async () => {
      const leaseId = 'lease1';

      mockApi.delete.mockResolvedValue(undefined);

      await dashboardService.deleteLease(leaseId);

      expect(mockApi.delete).toHaveBeenCalledWith(`/leases/${leaseId}`);
    });
  });

  describe('error handling', () => {
    it('should handle API errors for getLeases', async () => {
      const error = new Error('API Error');
      mockApi.get.mockRejectedValue(error);

      await expect(dashboardService.getLeases(1, 10)).rejects.toThrow('API Error');
    });

    it('should handle API errors for createLease', async () => {
      const error = new Error('API Error');
      mockApi.post.mockRejectedValue(error);

      const leaseData = {
        tenantId: 'tenant1',
        unitId: 'unit1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        rentAmount: 1500,
        paymentFrequency: 'monthly' as const,
        status: 'active' as const,
      };

      await expect(dashboardService.createLease(leaseData)).rejects.toThrow('API Error');
    });

    it('should handle API errors for updateLease', async () => {
      const error = new Error('API Error');
      mockApi.put.mockRejectedValue(error);

      await expect(dashboardService.updateLease('lease1', { rentAmount: 1600 })).rejects.toThrow('API Error');
    });

    it('should handle API errors for deleteLease', async () => {
      const error = new Error('API Error');
      mockApi.delete.mockRejectedValue(error);

      await expect(dashboardService.deleteLease('lease1')).rejects.toThrow('API Error');
    });
  });
});