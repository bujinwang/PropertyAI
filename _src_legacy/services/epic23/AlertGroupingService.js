const Alert = require('../models/Alert');
const AlertGroup = require('../models/epic23/AlertGroups');
const { Op } = require('sequelize');

// AlertGroupingService for Story 23.2
class AlertGroupingService {
  // Group alerts by type and priority with filters
  static async groupAlerts(propertyId, filters = {}) {
    const where = { propertyId };
    if (filters.type) where.type = filters.type;
    if (filters.priority) where.priority = filters.priority;
    if (filters.dateFrom) where.createdAt = { [Op.gte]: new Date(filters.dateFrom) };
    if (filters.dateTo) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(filters.dateTo) };

    const alerts = await Alert.findAll({
      where,
      attributes: ['type', 'priority', 'createdAt', 'id'], // Select relevant
      group: ['type', 'priority'],
      attributes: [
        'type',
        'priority',
        [Alert.sequelize.fn('COUNT', Alert.sequelize.col('id')), 'alertCount'],
        [Alert.sequelize.fn('MIN', Alert.sequelize.col('createdAt')), 'earliestAlert'],
        [Alert.sequelize.fn('MAX', Alert.sequelize.col('createdAt')), 'latestAlert'],
      ],
      order: [['priority', 'DESC'], ['type', 'ASC']],
      raw: true,
    });

    // Create or update groups
    const groups = [];
    for (const groupData of alerts) {
      const [group, created] = await AlertGroup.findOrCreate({
        where: { groupType: groupData.type, priority: groupData.priority, propertyId },
        defaults: {
          alertCount: parseInt(groupData.alertCount),
          createdAt: new Date(groupData.earliestAlert),
          updatedAt: new Date(groupData.latestAlert),
        },
      });

      if (!created) {
        group.alertCount = parseInt(groupData.alertCount);
        group.updatedAt = new Date(groupData.latestAlert);
        await group.save();
      }

      groups.push({
        ...group.toJSON(),
        alerts: await Alert.findAll({
          where: { type: groupData.type, priority: groupData.priority, propertyId },
        }),
      });
    }

    return groups;
  }

  // Get grouped alerts for API
  static async getGroupedAlerts(propertyId, filters = {}) {
    const groups = await this.groupAlerts(propertyId, filters);
    return {
      groups,
      totalAlerts: await Alert.count({ where: { propertyId } }),
      filtersApplied: Object.keys(filters).length > 0,
    };
  }

  // Utility to apply client-side filters if needed for small sets
  static applyClientSideFilters(alerts, filters) {
    let filtered = alerts;
    if (filters.type) filtered = filtered.filter(a => a.type === filters.type);
    if (filters.priority) filtered = filtered.filter(a => a.priority === filters.priority);
    // Group filtered
    const groups = filtered.reduce((acc, alert) => {
      const key = `${alert.type}-${alert.priority}`;
      if (!acc[key]) acc[key] = { type: alert.type, priority: alert.priority, alerts: [] };
      acc[key].alerts.push(alert);
      return acc;
    }, {});
    return Object.values(groups);
  }
}

module.exports = AlertGroupingService;