const Tenant = require('../models/Tenant');
const { Op } = require('sequelize');

// Existing CRUD assumed, extending updateTenant for payment fields
const updateTenant = async (tenantId, updates) => {
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Allow updating paymentMethods and subscriptionId
  if (updates.paymentMethods !== undefined) {
    tenant.paymentMethods = updates.paymentMethods;
  }
  if (updates.subscriptionId !== undefined) {
    tenant.subscriptionId = updates.subscriptionId;
  }

  // Update other fields as existing
  if (updates.name) tenant.name = updates.name;
  if (updates.email) tenant.email = updates.email;
  if (updates.phone) tenant.phone = updates.phone;
  if (updates.screeningStatus) tenant.screeningStatus = updates.screeningStatus;
  if (updates.matchingProfile) tenant.matchingProfile = updates.matchingProfile;
  if (updates.isActive !== undefined) tenant.isActive = updates.isActive;

  await tenant.save();
  return tenant;
};

module.exports = {
  updateTenant,
  // Assume other methods like createTenant, getTenant exist
};