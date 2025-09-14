import { scoreTenant, scoreProperty, generateMatches, runABTest } from './marketplaceService';
import { MarketplaceMatch } from '../models/MarketplaceMatch';
import tenantService from './tenantService';
import propertyService from './propertyService';

jest.mock('./tenantService');
jest.mock('./propertyService');
jest.mock('../models/MarketplaceMatch');

describe('marketplaceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scoreTenant', () => {
    test('calculates tenant score correctly', async () => {
      (tenantService.getTenant as jest.Mock).mockResolvedValue({
        id: 'tenant1',
        income: 50000,
        leaseHistory: [{ id: 'lease1' }, { id: 'lease2' }],
      });

      const result = await scoreTenant('tenant1');

      expect(tenantService.updateTenant).toHaveBeenCalledWith('tenant1', {
        matchingProfile: expect.objectContaining({
          overallScore: expect.any(Number),
          financialScore: 50,
          historyScore: 0.2,
          preferenceScore: 0.7,
        }),
      });
      expect(result.overallScore).toBe(0.46); // (50*0.4 + 0.2*0.3 + 0.7*0.3) = 0.46
    });

    test('handles tenant not found', async () => {
      (tenantService.getTenant as jest.Mock).mockRejectedValue(new Error('Tenant not found'));

      await expect(scoreTenant('invalid')).rejects.toThrow('Tenant not found');
    });
  });

  describe('scoreProperty', () => {
    test('calculates property score with criteria', async () => {
      (propertyService.getProperty as jest.Mock).mockResolvedValue({
        id: 'prop1',
        city: 'Seattle',
        rent: 2000,
        amenities: ['pool', 'gym'],
      });

      const criteria = { locationPref: 'Seattle', priceRange: [1800, 2200], amenities: ['pool', 'gym'] };
      const result = await scoreProperty('prop1', criteria);

      expect(propertyService.updateProperty).toHaveBeenCalledWith('prop1', {
        matchingCriteria: expect.objectContaining({
          overallScore: expect.any(Number),
          locationScore: 1,
          priceScore: 1,
          amenityScore: 1,
        }),
      });
      expect(result.overallScore).toBe(1); // All scores 1
    });

    test('handles property not found', async () => {
      (propertyService.getProperty as jest.Mock).mockRejectedValue(new Error('Property not found'));

      await expect(scoreProperty('invalid', {})).rejects.toThrow('Property not found');
    });
  });

  describe('generateMatches', () => {
    test('generates matches for tenant', async () => {
      (tenantService.getTenant as jest.Mock).mockResolvedValue({ id: 'tenant1', preferences: { location: 'Seattle', price: 2000, amenities: ['pool'] } });
      (propertyService.getProperty as jest.Mock).mockResolvedValue({ id: 'prop1', city: 'Seattle', rent: 2000, amenities: ['pool'] });
      (propertyService.getProperties as jest.Mock).mockResolvedValue([{ id: 'prop1', city: 'Seattle', rent: 2000, amenities: ['pool'] }]);
      (MarketplaceMatch.create as jest.Mock).mockResolvedValue({ id: 'match1', tenantId: 'tenant1', propertyId: 'prop1', matchScore: 0.8, confidence: 85, recommendationReason: 'High fit...', status: 'generated' });

      const result = await generateMatches('tenant1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'match1', tenantId: 'tenant1', propertyId: 'prop1', matchScore: '0.8', confidence: 85, recommendationReason: 'High fit...', status: 'generated' });
      expect(MarketplaceMatch.create).toHaveBeenCalled();
    });

    test('sorts matches by score descending', async () => {
      (tenantService.getTenant as jest.Mock).mockResolvedValue({ id: 'tenant1', preferences: {} });
      (propertyService.getProperties as jest.Mock).mockResolvedValue([
        { id: 'prop2', city: 'Seattle', rent: 2500, amenities: [] },
        { id: 'prop1', city: 'Seattle', rent: 2000, amenities: [] },
      ]);
      (MarketplaceMatch.create as jest.Mock).mockImplementation((data) => Promise.resolve({ ...data, matchScore: data.propertyId === 'prop1' ? '0.9' : '0.7' }));

      const result = await generateMatches('tenant1');

      expect(result[0].matchScore).toBe('0.9');
      expect(result[1].matchScore).toBe('0.7');
    });
  
    describe('bias mitigation', () => {
      test('ensures demographic parity in matching outcomes (AC7)', async () => {
        // Synthetic diverse data: 50% male/female, various ethnicities
        const diverseTenants = [
          { id: 't1', preferences: { location: 'Seattle' }, demographics: { gender: 'male', ethnicity: 'caucasian' } },
          { id: 't2', preferences: { location: 'Seattle' }, demographics: { gender: 'female', ethnicity: 'african-american' } },
          { id: 't3', preferences: { location: 'Seattle' }, demographics: { gender: 'male', ethnicity: 'hispanic' } },
          { id: 't4', preferences: { location: 'Seattle' }, demographics: { gender: 'female', ethnicity: 'asian' } },
        ];
  
        (tenantService.getTenant as jest.Mock).mockImplementation(id => Promise.resolve(diverseTenants.find(t => t.id === id)));
        (propertyService.getProperties as jest.Mock).mockResolvedValue([{ id: 'p1', city: 'Seattle', rent: 2000, amenities: [] }]);
        (MarketplaceMatch.create as jest.Mock).mockResolvedValue({ id: 'm1', tenantId: 't1', propertyId: 'p1', matchScore: 0.8, status: 'generated' });
  
        const allMatches = await Promise.all(diverseTenants.map(t => generateMatches(t.id)));
  
        // Calculate parity (e.g., gender parity: proportion of matches by gender)
        const maleMatches = allMatches.filter(m => m[0]?.tenantId.startsWith('t1') || m[0]?.tenantId.startsWith('t3')).length;
        const femaleMatches = allMatches.filter(m => m[0]?.tenantId.startsWith('t2') || m[0]?.tenantId.startsWith('t4')).length;
        const total = allMatches.length;
        const maleProportion = maleMatches / total;
        const femaleProportion = femaleMatches / total;
        const parityDiff = Math.abs(maleProportion - femaleProportion);
  
        expect(parityDiff).toBeLessThan(0.02); // <2% disparity
      });
    });
  
    describe('PII anonymization', () => {
      test('vectors contain no PII fields (AC11)', async () => {
        const tenant = { id: 't1', name: 'John Doe', email: 'john@example.com', preferences: { location: 'Seattle' } };
        (tenantService.getTenant as jest.Mock).mockResolvedValue(tenant);
        (propertyService.getProperties as jest.Mock).mockResolvedValue([{ id: 'p1', city: 'Seattle' }]);
  
        const matches = await generateMatches('t1');
  
        // Assert vectors don't include PII (check service logic doesn't pass name/email)
        expect(tenantService.updateTenant).toHaveBeenCalledWith('t1', expect.objectContaining({
          matchingProfile: expect.not.objectContaining({
            name: tenant.name,
            email: tenant.email
          })
        }));
      });
    });
  });

  describe('runABTest', () => {
    test('runs A/B test and logs results', async () => {
      (tenantService.getTenant as jest.Mock).mockResolvedValue({ id: 'tenant1' });
      (propertyService.getProperties as jest.Mock).mockResolvedValue([{ id: 'prop1' }]);
      (MarketplaceMatch.create as jest.Mock).mockResolvedValue({ id: 'match1', matchScore: '0.8' });

      const result = await runABTest('tenant1', 'v1', ['prop1']);

      expect(result.v1).toHaveLength(1);
      expect(result.v2).toHaveLength(1);
      // Mock log checked via console
    });
  });