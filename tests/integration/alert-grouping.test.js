const AlertGroupingService = require('../../src/services/epic23/AlertGroupingService');
const Alert = require('../../src/models/Alert');
const { sequelize } = require('../../src/models');

// Integration test with DB
describe('AlertGroupingService Integration', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.drop();
  });

  it('integrates with existing Alert model', async () => {
    const alert = await Alert.create({
      id: 'test-alert',
      type: 'maintenance',
      priority: 'high',
      propertyId: 'test-prop',
    });

    const groups = await AlertGroupingService.groupAlerts('test-prop');
    expect(groups).toHaveLength(1);
    expect(groups[0].alerts).toHaveLength(1);
    expect(groups[0].alerts[0].id).toBe('test-alert');
  });

  it('creates groups and associates alerts', async () => {
    const alerts = [
      { id: '1', type: 'maintenance', priority: 'high', propertyId: 'test' },
      { id: '2', type: 'maintenance', priority: 'high', propertyId: 'test' },
      { id: '3', type: 'churn', priority: 'medium', propertyId: 'test' },
    ];
    await Promise.all(alerts.map(a => Alert.create(a)));

    const groups = await AlertGroupingService.groupAlerts('test');
    expect(groups).toHaveLength(2);
    expect(groups[0].alerts.length).toBe(2);
    expect(groups[1].alerts.length).toBe(1);
  });
});