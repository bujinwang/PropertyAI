const AlertGroupingService = require('../../src/services/epic23/AlertGroupingService');
const Alert = require('../../src/models/Alert');
const { sequelize } = require('../../src/models');

// Unit tests for AlertGroupingService (Story 23.2)
describe('AlertGroupingService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.drop();
  });

  it('groups alerts by type and priority', async () => {
    await Alert.bulkCreate([
      { type: 'maintenance', priority: 'high', propertyId: 'test-prop' },
      { type: 'maintenance', priority: 'high', propertyId: 'test-prop' },
      { type: 'churn', priority: 'medium', propertyId: 'test-prop' },
    ]);

    const groups = await AlertGroupingService.groupAlerts('test-prop');
    expect(groups).toHaveLength(2);
    expect(groups[0].alerts.length).toBe(2);
    expect(groups[0].groupType).toBe('maintenance');
    expect(groups[0].priority).toBe('high');
    expect(groups[1].alerts.length).toBe(1);
    expect(groups[1].groupType).toBe('churn');
    expect(groups[1].priority).toBe('medium');
  });

  it('applies filters to grouping', async () => {
    await Alert.bulkCreate([
      { type: 'maintenance', priority: 'high', propertyId: 'test-prop' },
      { type: 'churn', priority: 'high', propertyId: 'test-prop' },
    ]);

    const groups = await AlertGroupingService.groupAlerts('test-prop', { type: 'maintenance' });
    expect(groups).toHaveLength(1);
    expect(groups[0].groupType).toBe('maintenance');
    expect(groups[0].alerts.length).toBe(1);
  });

  it('handles empty alerts gracefully', async () => {
    const groups = await AlertGroupingService.groupAlerts('non-existent-prop');
    expect(groups).toBeArray();
    expect(groups.length).toBe(0);
  });
});