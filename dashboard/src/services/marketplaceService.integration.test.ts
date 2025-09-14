import request from 'supertest';
import app from '../../app'; // Assume Express app entry
import { sequelize } from '../../models'; // Assume Sequelize instance
import { Tenant, Property, MarketplaceMatch } from '../../models';

describe('Marketplace API Integration (AC8)', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Test DB
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Tenant.destroy({ where: {} });
    await Property.destroy({ where: {} });
    await MarketplaceMatch.destroy({ where: {} });
  });

  test('POST /api/marketplace/match creates matches in DB and returns response', async () => {
    // Setup test data
    const tenant = await Tenant.create({
      id: 'test-tenant',
      name: 'Test Tenant',
      income: 50000,
      preferences: { location: 'Seattle' }
    });

    const property = await Property.create({
      id: 'test-prop',
      address: '123 Seattle St',
      rent: 2000,
      city: 'Seattle',
      amenities: ['pool']
    });

    // Mock auth token (assume middleware)
    const token = 'mock-jwt-token'; // Or use test auth setup

    const response = await request(app)
      .post('/api/marketplace/match')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId: 'test-tenant', propertyIds: ['test-prop'] })
      .expect(200);

    expect(response.body.matches).toHaveLength(1);
    expect(response.body.matches[0].matchScore).toBeDefined();

    // Verify DB insert
    const match = await MarketplaceMatch.findOne({ where: { tenantId: 'test-tenant' } });
    expect(match).toBeTruthy();
    expect(match.tenantId).toBe('test-tenant');
    expect(match.propertyId).toBe('test-prop');
    expect(match.status).toBe('generated');
  });

  test('error handling in integration flow', async () => {
    // Invalid tenant
    const response = await request(app)
      .post('/api/marketplace/match')
      .set('Authorization', 'Bearer mock-token')
      .send({ tenantId: 'invalid', propertyIds: [] })
      .expect(404); // Or 500 for error

    expect(response.body.error).toBeDefined();
    expect(MarketplaceMatch.count()).toBe(0); // No partial insert
  });
});