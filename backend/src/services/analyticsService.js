const { Sequelize, Op } = require('sequelize');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const MaintenanceHistory = require('../models/MaintenanceHistory');

const getMetrics = async (dateFrom, dateTo, propertyIds, userRole, userProperties) => {
  // Role-based filtering
  let filteredPropertyIds = propertyIds;
  if (userRole === 'manager') {
    filteredPropertyIds = userProperties || [];
  }

  // If no properties specified and not manager, get all
  if (!filteredPropertyIds || filteredPropertyIds.length === 0) {
    const allProperties = await Property.findAll({ attributes: ['id'] });
    filteredPropertyIds = allProperties.map(p => p.id);
  }

  // Active tenants
  const activeTenants = await Tenant.count({
    where: {
      isActive: true,
      propertyId: { [Op.in]: filteredPropertyIds }
    }
  });

  // Total units (assume Property has totalUnits field)
  const totalUnitsResult = await Property.sum('totalUnits', {
    where: { id: { [Op.in]: filteredPropertyIds } }
  });
  const totalUnits = totalUnitsResult || 0;

  // Occupancy rate
  const occupancyRate = totalUnits > 0 ? (activeTenants / totalUnits) * 100 : 0;

  // Total revenue (sum of paid payments in date range)
  const totalRevenue = await Payment.sum('amount', {
    where: {
      status: 'paid',
      createdAt: { [Op.between]: [dateFrom, dateTo] }
    },
    include: [{
      model: Tenant,
      where: { propertyId: { [Op.in]: filteredPropertyIds } },
      attributes: []
    }]
  }) || 0;

  // Average rent (average of invoice amounts in date range)
  const avgRentResult = await Invoice.findAll({
    attributes: [
      [Sequelize.fn('AVG', Sequelize.col('amount')), 'avgRent']
    ],
    where: {
      dueDate: { [Op.between]: [dateFrom, dateTo] }
    },
    include: [{
      model: Tenant,
      where: { propertyId: { [Op.in]: filteredPropertyIds } },
      attributes: []
    }],
    raw: true
  });
  const avgRent = avgRentResult[0]?.avgRent || 0;

  return {
    occupancyRate: parseFloat(occupancyRate.toFixed(2)),
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    avgRent: parseFloat(avgRent.toFixed(2)),
    activeTenants
  };
};

const getAdvancedMetrics = async (dateFrom, dateTo, propertyIds, userRole, userProperties) => {
  // Role-based filtering
  let filteredPropertyIds = propertyIds;
  if (userRole === 'manager') {
    filteredPropertyIds = userProperties || [];
  }
  if (!filteredPropertyIds || filteredPropertyIds.length === 0) {
    const allProperties = await Property.findAll({ attributes: ['id'] });
    filteredPropertyIds = allProperties.map(p => p.id);
  }

  // Churn rate: tenants who became inactive in date range
  const churnResult = await Tenant.findAll({
    where: {
      isActive: false,
      updatedAt: { [Op.between]: [dateFrom, dateTo] },
      propertyId: { [Op.in]: filteredPropertyIds }
    },
    attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'churnCount']],
    raw: true
  });
  const churnCount = churnResult[0]?.churnCount || 0;

  const totalTenants = await Tenant.count({
    where: { propertyId: { [Op.in]: filteredPropertyIds } }
  });
  const churnRate = totalTenants > 0 ? (churnCount / totalTenants) * 100 : 0;

  // ROI: placeholder as revenue / revenue = 1 (no expenses in model)
  const revenue = await Payment.sum('amount', {
    where: {
      status: 'paid',
      createdAt: { [Op.between]: [dateFrom, dateTo] }
    },
    include: [{
      model: Tenant,
      where: { propertyId: { [Op.in]: filteredPropertyIds } },
      attributes: []
    }]
  }) || 0;
  const roi = revenue > 0 ? 1 : 0; // Placeholder calculation

  // Vacancy rate: (total units - occupied units) / total units
  const totalUnits = await Property.sum('totalUnits', {
    where: { id: { [Op.in]: filteredPropertyIds } }
  }) || 0;
  const activeTenants = await Tenant.count({
    where: {
      isActive: true,
      propertyId: { [Op.in]: filteredPropertyIds }
    }
  });
  const vacancyRate = totalUnits > 0 ? ((totalUnits - activeTenants) / totalUnits) * 100 : 0;

  return {
    churnRate: parseFloat(churnRate.toFixed(2)),
    roi: parseFloat(roi.toFixed(2)),
    vacancyRate: parseFloat(vacancyRate.toFixed(2))
  };
};

const predictChurn = async (tenantId) => {
  try {
    // Get tenant data
    const tenant = await Tenant.findByPk(tenantId, {
      include: [
        { model: Property, as: 'property' }
      ]
    });

    if (!tenant) {
      return {
        predictions: [],
        message: 'Tenant not found',
      };
    }

    // Get payment history
    const payments = await Payment.findAll({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      limit: 24, // Last 24 months of payments
    });

    // Get invoice history
    const invoices = await Invoice.findAll({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      limit: 24,
    });

    // Calculate churn risk factors
    const riskFactors = {
      latePayments: 0,
      failedPayments: 0,
      overdueInvoices: 0,
      totalPayments: payments.length,
      totalInvoices: invoices.length,
      leaseDuration: Math.floor((Date.now() - tenant.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)), // months
      screeningRisk: tenant.screeningStatus?.riskLevel === 'high' ? 1 : 0,
    };

    // Analyze payment patterns
    payments.forEach(payment => {
      if (payment.status === 'failed') riskFactors.failedPayments++;
    });

    // Analyze invoice patterns
    invoices.forEach(invoice => {
      if (invoice.status === 'overdue') riskFactors.overdueInvoices++;
      if (invoice.dueDate < new Date() && invoice.status !== 'paid') riskFactors.latePayments++;
    });

    // Calculate churn probability using weighted algorithm
    let churnProbability = 0;

    // Late payment factor (30% weight)
    if (riskFactors.totalPayments > 0) {
      const latePaymentRate = riskFactors.latePayments / riskFactors.totalPayments;
      churnProbability += latePaymentRate * 0.3;
    }

    // Failed payment factor (25% weight)
    if (riskFactors.totalPayments > 0) {
      const failedPaymentRate = riskFactors.failedPayments / riskFactors.totalPayments;
      churnProbability += failedPaymentRate * 0.25;
    }

    // Overdue invoice factor (20% weight)
    if (riskFactors.totalInvoices > 0) {
      const overdueRate = riskFactors.overdueInvoices / riskFactors.totalInvoices;
      churnProbability += overdueRate * 0.2;
    }

    // Lease duration factor (15% weight) - shorter leases = higher risk
    const leaseRisk = Math.max(0, (12 - riskFactors.leaseDuration) / 12);
    churnProbability += leaseRisk * 0.15;

    // Screening risk factor (10% weight)
    churnProbability += riskFactors.screeningRisk * 0.1;

    // Normalize to 0-100
    churnProbability = Math.min(100, Math.max(0, churnProbability * 100));

    // Determine risk level
    let riskLevel = 'low';
    if (churnProbability >= 70) riskLevel = 'high';
    else if (churnProbability >= 40) riskLevel = 'medium';

    // Generate retention recommendations
    const recommendations = [];
    if (churnProbability >= 70) {
      recommendations.push('Immediate intervention required - schedule retention meeting');
      recommendations.push('Consider lease renewal incentives');
    } else if (churnProbability >= 40) {
      recommendations.push('Monitor closely - send satisfaction survey');
      recommendations.push('Offer maintenance improvements');
    }

    if (riskFactors.latePayments > 0) {
      recommendations.push('Address payment concerns - offer payment plan');
    }

    if (riskFactors.failedPayments > 0) {
      recommendations.push('Review payment methods - update billing information');
    }

    // Calculate confidence based on data availability
    const dataPoints = riskFactors.totalPayments + riskFactors.totalInvoices;
    const confidence = Math.min(95, Math.max(10, dataPoints * 4)); // 10-95% confidence

    return {
      tenantId,
      churnProbability: Math.round(churnProbability),
      riskLevel,
      confidence: Math.round(confidence),
      riskFactors,
      recommendations,
      lastUpdated: new Date().toISOString(),
      message: 'Churn prediction completed successfully',
    };

  } catch (error) {
    console.error('Error predicting churn:', error);
    return {
      tenantId,
      error: 'Failed to generate churn prediction',
      churnProbability: 0,
      riskLevel: 'unknown',
      confidence: 0,
    };
  }
};

const predictMaintenance = async (propertyId) => {
  try {
    // Get maintenance history for the property
    const history = await MaintenanceHistory.findAll({
      where: { propertyId },
      order: [['date', 'DESC']],
      limit: 100, // Last 100 maintenance records
    });

    if (history.length < 5) {
      return {
        predictions: [],
        message: 'Insufficient maintenance history for predictions',
      };
    }

    // Simple predictive algorithm based on patterns
    const predictions = [];
    const maintenanceTypes = [
      'plumbing', 'electrical', 'hvac', 'roofing', 'appliance',
      'structural', 'painting', 'flooring', 'pest_control', 'landscaping', 'security'
    ];

    // Analyze patterns for each maintenance type
    maintenanceTypes.forEach(type => {
      const typeHistory = history.filter(record => record.type === type);

      if (typeHistory.length >= 2) {
        // Calculate average interval between maintenance
        const intervals = [];
        for (let i = 1; i < typeHistory.length; i++) {
          const interval = typeHistory[i - 1].date - typeHistory[i].date;
          intervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
        }

        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const lastMaintenance = new Date(Math.max(...typeHistory.map(r => r.date.getTime())));

        // Predict next maintenance date
        const predictedDate = new Date(lastMaintenance.getTime() + (avgInterval * 24 * 60 * 60 * 1000));

        // Calculate confidence based on data consistency
        const intervalVariance = intervals.reduce((sum, interval) => {
          return sum + Math.pow(interval - avgInterval, 2);
        }, 0) / intervals.length;
        const confidence = Math.max(0.1, Math.min(0.95, 1 - (intervalVariance / (avgInterval * avgInterval))));

        // Only predict if within next 6 months and confidence > 70%
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        if (predictedDate <= sixMonthsFromNow && confidence >= 0.7) {
          // Estimate cost based on historical data
          const avgCost = typeHistory.reduce((sum, record) => sum + parseFloat(record.cost), 0) / typeHistory.length;

          predictions.push({
            type,
            predictedDate: predictedDate.toISOString().split('T')[0],
            confidence: Math.round(confidence * 100),
            estimatedCost: Math.round(avgCost),
            priority: typeHistory.some(r => r.priority === 'high' || r.priority === 'critical') ? 'high' : 'medium',
            reason: `Based on ${typeHistory.length} historical maintenance records`,
          });
        }
      }
    });

    // Sort by date and filter top 5 predictions
    predictions.sort((a, b) => new Date(a.predictedDate) - new Date(b.predictedDate));

    return {
      predictions: predictions.slice(0, 5),
      totalAnalyzed: history.length,
      message: predictions.length > 0 ? 'Predictions generated successfully' : 'No high-confidence predictions available',
    };

  } catch (error) {
    console.error('Error predicting maintenance:', error);
    return {
      predictions: [],
      error: 'Failed to generate maintenance predictions',
    };
  }
};

const generateExport = async (format, template, filters, userId, userRole, userProperties) => {
  try {
    const exportService = require('../utils/exportService');

    // Validate export parameters
    exportService.validateExportParams(format, template, filters);

    // Get date range
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();
    const propertyIdsArray = filters.propertyIds ? filters.propertyIds.split(',').map(id => id.trim()) : [];

    // Get analytics data
    const analyticsData = await getMetrics(dateFrom, dateTo, propertyIdsArray, userRole, userProperties);

    // Add additional data based on template
    let exportData = { ...analyticsData };

    if (template === 'audit') {
      // Get audit trail data (mock for now - would come from audit service)
      exportData.auditTrail = [
        {
          createdAt: new Date().toISOString(),
          action: 'EXPORT_GENERATED',
          entityType: 'ANALYTICS',
          entityId: 'export_' + Date.now(),
          user: userId,
          details: `Generated ${format.toUpperCase()} export for ${template} template`
        }
      ];
    }

    // Generate export file
    let fileContent;
    let contentType;
    let filename;

    if (format === 'pdf') {
      fileContent = await exportService.generatePDF(exportData, template, filters);
      contentType = 'application/pdf';
      filename = `${template}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    } else if (format === 'csv') {
      fileContent = await exportService.generateCSV(exportData, template, filters);
      contentType = 'text/csv';
      filename = `${template}-report-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // For small files, return base64 content
    if (Buffer.isBuffer(fileContent) && fileContent.length < 5 * 1024 * 1024) { // < 5MB
      const base64Content = fileContent.toString('base64');
      return {
        success: true,
        exportId: `export_${Date.now()}_${userId}`,
        format,
        template,
        filename,
        contentType,
        data: base64Content,
        size: fileContent.length
      };
    } else {
      // For larger files, save to temp location and return signed URL
      const fs = require('fs').promises;
      const path = require('path');
      const tempPath = path.join('/tmp', `export_${Date.now()}_${filename}`);
      await fs.writeFile(tempPath, fileContent);

      // Mock signed URL for development
      const signedUrl = `http://localhost:3000/temp-exports/${filename}`;

      return {
        success: true,
        exportId: `export_${Date.now()}_${userId}`,
        format,
        template,
        filename,
        contentType,
        signedUrl,
        expiresIn: 3600, // 1 hour
        attachmentData: fileContent // For email attachments
      };
    }

  } catch (error) {
    console.error('Error generating export:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  getMetrics,
  getAdvancedMetrics,
  predictMaintenance,
  predictChurn,
  generateExport
};