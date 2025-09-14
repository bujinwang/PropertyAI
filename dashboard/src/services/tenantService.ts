const Tenant = require('../models/Tenant');

const tenantService = {
  async getTenant(tenantId) {
    return await Tenant.findByPk(tenantId);
  },

  async updateTenant(tenantId, updates) {
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) throw new Error('Tenant not found');
    return await tenant.update(updates);
  },

  async createTenant(tenantData) {
    return await Tenant.create(tenantData);
  },
};

module.exports = tenantService;