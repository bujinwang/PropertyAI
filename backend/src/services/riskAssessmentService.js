const RiskAssessment = require('../models/RiskAssessment');
const RiskFactor = require('../models/RiskFactor');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const { Op } = require('sequelize');

class RiskAssessmentService {
  constructor() {
    this.RISK_THRESHOLDS = {
      minimal: { min: 0.0, max: 0.9 },
      low: { min: 1.0, max: 1.9 },
      medium: { min: 2.0, max: 2.9 },
      high: { min: 3.0, max: 3.9 },
      critical: { min: 4.0, max: 5.0 }
    };

    this.RISK_WEIGHTS = {
      maintenance: 0.25,
      churn: 0.20,
      market: 0.15,
      financial: 0.15,
      operational: 0.10,
      compliance: 0.10,
      behavioral: 0.15,
      payment: 0.20,
      satisfaction: 0.10,
      concentration: 0.05
    };
  }

  /**
   * Assess risk for a property
   * @param {string} propertyId - Property ID to assess
   * @param {Object} options - Assessment options
   * @returns {Promise<Object>} Risk assessment result
   */
  async assessPropertyRisk(propertyId, options = {}) {
    try {
      const property = await Property.findByPk(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      const riskFactors = await this.calculatePropertyRiskFactors(property);
      const overallScore = this.calculateOverallRiskScore(riskFactors);
      const riskLevel = this.determineRiskLevel(overallScore);

      // Create risk assessment record
      const assessment = await RiskAssessment.create({
        entityType: 'property',
        entityId: propertyId,
        assessmentType: options.type || 'comprehensive',
        overallRiskScore: overallScore,
        riskLevel: riskLevel,
        confidence: this.calculateConfidence(riskFactors),
        riskFactors: riskFactors,
        mitigationStrategies: this.generateMitigationStrategies(riskFactors, 'property'),
        assessmentDate: new Date(),
        nextAssessmentDate: this.calculateNextAssessmentDate(),
        dataQuality: this.calculateDataQuality(riskFactors)
      });

      // Create individual risk factor records
      await this.createRiskFactorRecords(assessment.id, riskFactors);

      // Update property with risk information
      await this.updatePropertyRiskData(propertyId, assessment);

      return {
        assessmentId: assessment.id,
        overallScore: overallScore,
        riskLevel: riskLevel,
        riskFactors: riskFactors,
        mitigationStrategies: assessment.mitigationStrategies,
        confidence: assessment.confidence
      };

    } catch (error) {
      console.error('Property risk assessment failed:', error);
      throw new Error(`Property risk assessment failed: ${error.message}`);
    }
  }

  /**
   * Assess risk for a tenant
   * @param {string} tenantId - Tenant ID to assess
   * @param {Object} options - Assessment options
   * @returns {Promise<Object>} Risk assessment result
   */
  async assessTenantRisk(tenantId, options = {}) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const riskFactors = await this.calculateTenantRiskFactors(tenant);
      const overallScore = this.calculateOverallRiskScore(riskFactors);
      const riskLevel = this.determineRiskLevel(overallScore);

      // Create risk assessment record
      const assessment = await RiskAssessment.create({
        entityType: 'tenant',
        entityId: tenantId,
        assessmentType: options.type || 'comprehensive',
        overallRiskScore: overallScore,
        riskLevel: riskLevel,
        confidence: this.calculateConfidence(riskFactors),
        riskFactors: riskFactors,
        mitigationStrategies: this.generateMitigationStrategies(riskFactors, 'tenant'),
        assessmentDate: new Date(),
        nextAssessmentDate: this.calculateNextAssessmentDate(),
        dataQuality: this.calculateDataQuality(riskFactors)
      });

      // Create individual risk factor records
      await this.createRiskFactorRecords(assessment.id, riskFactors);

      // Update tenant with risk information
      await this.updateTenantRiskData(tenantId, assessment);

      return {
        assessmentId: assessment.id,
        overallScore: overallScore,
        riskLevel: riskLevel,
        riskFactors: riskFactors,
        mitigationStrategies: assessment.mitigationStrategies,
        confidence: assessment.confidence
      };

    } catch (error) {
      console.error('Tenant risk assessment failed:', error);
      throw new Error(`Tenant risk assessment failed: ${error.message}`);
    }
  }

  /**
   * Assess portfolio-wide risk
   * @param {Object} options - Assessment options
   * @returns {Promise<Object>} Portfolio risk assessment result
   */
  async assessPortfolioRisk(options = {}) {
    try {
      // Get all properties and tenants
      const [properties, tenants] = await Promise.all([
        Property.findAll({ where: { status: 'active' } }),
        Tenant.findAll({ where: { isActive: true } })
      ]);

      const propertyRisks = [];
      const tenantRisks = [];

      // Assess all properties
      for (const property of properties) {
        try {
          const riskAssessment = await this.assessPropertyRisk(property.id, { type: 'portfolio' });
          propertyRisks.push({
            entityId: property.id,
            entityName: property.name,
            riskScore: riskAssessment.overallScore,
            riskLevel: riskAssessment.riskLevel
          });
        } catch (error) {
          console.warn(`Failed to assess property ${property.id}:`, error.message);
        }
      }

      // Assess all tenants
      for (const tenant of tenants) {
        try {
          const riskAssessment = await this.assessTenantRisk(tenant.id, { type: 'portfolio' });
          tenantRisks.push({
            entityId: tenant.id,
            entityName: tenant.name,
            riskScore: riskAssessment.overallScore,
            riskLevel: riskAssessment.riskLevel
          });
        } catch (error) {
          console.warn(`Failed to assess tenant ${tenant.id}:`, error.message);
        }
      }

      // Calculate portfolio risk metrics
      const portfolioRisk = this.calculatePortfolioRisk(propertyRisks, tenantRisks);

      // Create portfolio assessment record
      const assessment = await RiskAssessment.create({
        entityType: 'portfolio',
        entityId: 'portfolio-main',
        assessmentType: 'portfolio',
        overallRiskScore: portfolioRisk.overallScore,
        riskLevel: portfolioRisk.riskLevel,
        confidence: portfolioRisk.confidence,
        riskFactors: portfolioRisk.riskFactors,
        mitigationStrategies: portfolioRisk.mitigationStrategies,
        assessmentDate: new Date(),
        nextAssessmentDate: this.calculateNextAssessmentDate(),
        dataQuality: portfolioRisk.dataQuality
      });

      return {
        assessmentId: assessment.id,
        portfolioRisk: portfolioRisk,
        propertyRisks: propertyRisks,
        tenantRisks: tenantRisks,
        summary: {
          totalProperties: properties.length,
          totalTenants: tenants.length,
          assessedProperties: propertyRisks.length,
          assessedTenants: tenantRisks.length,
          criticalRisks: portfolioRisk.criticalCount,
          highRisks: portfolioRisk.highCount
        }
      };

    } catch (error) {
      console.error('Portfolio risk assessment failed:', error);
      throw new Error(`Portfolio risk assessment failed: ${error.message}`);
    }
  }

  /**
   * Calculate risk factors for a property
   * @param {Object} property - Property data
   * @returns {Promise<Object>} Risk factors
   */
  async calculatePropertyRiskFactors(property) {
    const factors = {};

    // Maintenance risk
    factors.maintenance = await this.calculateMaintenanceRisk(property);

    // Market risk
    factors.market = await this.calculateMarketRisk(property);

    // Financial risk
    factors.financial = await this.calculateFinancialRisk(property);

    // Operational risk
    factors.operational = await this.calculateOperationalRisk(property);

    // Compliance risk
    factors.compliance = await this.calculateComplianceRisk(property);

    return factors;
  }

  /**
   * Calculate risk factors for a tenant
   * @param {Object} tenant - Tenant data
   * @returns {Promise<Object>} Risk factors
   */
  async calculateTenantRiskFactors(tenant) {
    const factors = {};

    // Churn risk
    factors.churn = await this.calculateChurnRisk(tenant);

    // Payment risk
    factors.payment = await this.calculatePaymentRisk(tenant);

    // Behavioral risk
    factors.behavioral = await this.calculateBehavioralRisk(tenant);

    // Financial risk
    factors.financial = await this.calculateTenantFinancialRisk(tenant);

    // Satisfaction risk
    factors.satisfaction = await this.calculateSatisfactionRisk(tenant);

    return factors;
  }

  /**
   * Calculate maintenance risk for property
   * @param {Object} property - Property data
   * @returns {Promise<Object>} Maintenance risk factor
   */
  async calculateMaintenanceRisk(property) {
    let score = 0;
    let confidence = 0.8;

    // Age-based risk
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      if (age > 50) score += 2.0;
      else if (age > 30) score += 1.0;
      else if (age > 20) score += 0.5;
    }

    // Maintenance history risk (simplified)
    // In real implementation, this would analyze actual maintenance records
    const maintenanceHistory = property.riskMetadata?.maintenanceHistory || [];
    if (maintenanceHistory.length > 10) score += 1.0; // High maintenance property
    else if (maintenanceHistory.length > 5) score += 0.5;

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.maintenance,
      impact: 3.0,
      probability: 0.7,
      confidence: confidence,
      trend: 'stable',
      factors: ['property_age', 'maintenance_history']
    };
  }

  /**
   * Calculate market risk for property
   * @param {Object} property - Property data
   * @returns {Promise<Object>} Market risk factor
   */
  async calculateMarketRisk(property) {
    let score = 0;
    let confidence = 0.7;

    // Vacancy rate risk
    if (property.vacancyRate) {
      if (property.vacancyRate > 20) score += 2.0;
      else if (property.vacancyRate > 10) score += 1.0;
      else if (property.vacancyRate > 5) score += 0.5;
    }

    // Market trend risk
    if (property.marketTrend === 'decreasing') score += 1.5;
    else if (property.marketTrend === 'stable') score += 0.5;

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.market,
      impact: 4.0,
      probability: 0.6,
      confidence: confidence,
      trend: property.marketTrend || 'stable',
      factors: ['vacancy_rate', 'market_trend']
    };
  }

  /**
   * Calculate financial risk for property
   * @param {Object} property - Property data
   * @returns {Promise<Object>} Financial risk factor
   */
  async calculateFinancialRisk(property) {
    let score = 0;
    let confidence = 0.6;

    // This would analyze financial metrics like NOI, cap rate, debt service coverage
    // For now, using simplified logic
    if (property.marketValue && property.vacancyRate) {
      // High vacancy + high value = higher financial risk
      if (property.vacancyRate > 15 && property.marketValue > 1000000) {
        score += 2.0;
      }
    }

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.financial,
      impact: 5.0,
      probability: 0.4,
      confidence: confidence,
      trend: 'stable',
      factors: ['revenue_stability', 'debt_service']
    };
  }

  /**
   * Calculate operational risk for property
   * @param {Object} property - Property data
   * @returns {Promise<Object>} Operational risk factor
   */
  async calculateOperationalRisk(property) {
    let score = 0;
    let confidence = 0.7;

    // Property size risk
    if (property.totalUnits > 100) score += 1.0;
    else if (property.totalUnits > 50) score += 0.5;

    // Management complexity
    if (property.propertyType === 'commercial') score += 0.5;

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.operational,
      impact: 3.0,
      probability: 0.5,
      confidence: confidence,
      trend: 'stable',
      factors: ['property_size', 'management_complexity']
    };
  }

  /**
   * Calculate compliance risk for property
   * @param {Object} property - Property data
   * @returns {Promise<Object>} Compliance risk factor
   */
  async calculateComplianceRisk(property) {
    let score = 0;
    let confidence = 0.8;

    // Age-based compliance risk (older buildings may have outdated compliance)
    if (property.yearBuilt) {
      const age = new Date().getFullYear() - property.yearBuilt;
      if (age > 40) score += 1.0;
      else if (age > 20) score += 0.5;
    }

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.compliance,
      impact: 4.0,
      probability: 0.3,
      confidence: confidence,
      trend: 'stable',
      factors: ['building_age', 'regulatory_compliance']
    };
  }

  /**
   * Calculate churn risk for tenant
   * @param {Object} tenant - Tenant data
   * @returns {Promise<Object>} Churn risk factor
   */
  async calculateChurnRisk(tenant) {
    let score = 0;
    let confidence = 0.7;

    // Renewal likelihood
    if (tenant.renewalLikelihood !== undefined) {
      if (tenant.renewalLikelihood < 0.3) score += 2.0;
      else if (tenant.renewalLikelihood < 0.5) score += 1.0;
      else if (tenant.renewalLikelihood < 0.7) score += 0.5;
    }

    // Lease violations
    const violations = tenant.leaseViolations || [];
    if (violations.length > 5) score += 1.5;
    else if (violations.length > 2) score += 1.0;
    else if (violations.length > 0) score += 0.5;

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.churn,
      impact: 4.0,
      probability: 0.6,
      confidence: confidence,
      trend: tenant.riskTrend || 'stable',
      factors: ['renewal_likelihood', 'lease_violations']
    };
  }

  /**
   * Calculate payment risk for tenant
   * @param {Object} tenant - Tenant data
   * @returns {Promise<Object>} Payment risk factor
   */
  async calculatePaymentRisk(tenant) {
    let score = 0;
    let confidence = 0.8;

    // Payment history analysis
    const paymentHistory = tenant.paymentHistory || [];
    const latePayments = paymentHistory.filter(p => p.status === 'late').length;
    const totalPayments = paymentHistory.length;

    if (totalPayments > 0) {
      const latePaymentRate = latePayments / totalPayments;
      if (latePaymentRate > 0.5) score += 2.0;
      else if (latePaymentRate > 0.3) score += 1.5;
      else if (latePaymentRate > 0.1) score += 1.0;
      else if (latePaymentRate > 0) score += 0.5;
    }

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.payment,
      impact: 5.0,
      probability: 0.7,
      confidence: confidence,
      trend: 'stable',
      factors: ['payment_history', 'late_payment_rate']
    };
  }

  /**
   * Calculate behavioral risk for tenant
   * @param {Object} tenant - Tenant data
   * @returns {Promise<Object>} Behavioral risk factor
   */
  async calculateBehavioralRisk(tenant) {
    let score = 0;
    let confidence = 0.7;

    // Complaint history
    const complaints = tenant.complaintHistory || [];
    if (complaints.length > 10) score += 2.0;
    else if (complaints.length > 5) score += 1.0;
    else if (complaints.length > 2) score += 0.5;

    // Lease violations (additional weight)
    const violations = tenant.leaseViolations || [];
    if (violations.length > 3) score += 1.0;
    else if (violations.length > 1) score += 0.5;

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.behavioral,
      impact: 3.0,
      probability: 0.5,
      confidence: confidence,
      trend: 'stable',
      factors: ['complaint_history', 'lease_violations']
    };
  }

  /**
   * Calculate financial risk for tenant
   * @param {Object} tenant - Tenant data
   * @returns {Promise<Object>} Financial risk factor
   */
  async calculateTenantFinancialRisk(tenant) {
    let score = 0;
    let confidence = 0.6;

    // This would analyze credit score, income stability, etc.
    // For now, using simplified logic based on available data
    if (tenant.screeningStatus?.riskLevel === 'high') score += 2.0;
    else if (tenant.screeningStatus?.riskLevel === 'medium') score += 1.0;

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.financial,
      impact: 4.0,
      probability: 0.4,
      confidence: confidence,
      trend: 'stable',
      factors: ['credit_score', 'income_stability']
    };
  }

  /**
   * Calculate satisfaction risk for tenant
   * @param {Object} tenant - Tenant data
   * @returns {Promise<Object>} Satisfaction risk factor
   */
  async calculateSatisfactionRisk(tenant) {
    let score = 0;
    let confidence = 0.7;

    // Satisfaction rating
    if (tenant.marketSatisfaction) {
      if (tenant.marketSatisfaction < 2.0) score += 2.0;
      else if (tenant.marketSatisfaction < 3.0) score += 1.0;
      else if (tenant.marketSatisfaction < 4.0) score += 0.5;
    }

    return {
      score: Math.min(score, 5.0),
      weight: this.RISK_WEIGHTS.satisfaction,
      impact: 3.0,
      probability: 0.6,
      confidence: confidence,
      trend: 'stable',
      factors: ['satisfaction_rating', 'feedback_analysis']
    };
  }

  /**
   * Calculate overall risk score from factors
   * @param {Object} riskFactors - Risk factors object
   * @returns {number} Overall risk score
   */
  calculateOverallRiskScore(riskFactors) {
    let totalScore = 0;
    let totalWeight = 0;

    Object.values(riskFactors).forEach(factor => {
      totalScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    });

    return totalWeight > 0 ? Math.min(totalScore / totalWeight, 5.0) : 0;
  }

  /**
   * Determine risk level from score
   * @param {number} score - Risk score
   * @returns {string} Risk level
   */
  determineRiskLevel(score) {
    if (score >= 4.0) return 'critical';
    if (score >= 3.0) return 'high';
    if (score >= 2.0) return 'medium';
    if (score >= 1.0) return 'low';
    return 'minimal';
  }

  /**
   * Calculate confidence level for assessment
   * @param {Object} riskFactors - Risk factors
   * @returns {number} Confidence score
   */
  calculateConfidence(riskFactors) {
    const confidences = Object.values(riskFactors).map(f => f.confidence);
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    return Math.min(avgConfidence, 1.0);
  }

  /**
   * Calculate data quality score
   * @param {Object} riskFactors - Risk factors
   * @returns {number} Data quality score
   */
  calculateDataQuality(riskFactors) {
    // Simplified data quality calculation
    const factorsWithData = Object.values(riskFactors).filter(f => f.score > 0).length;
    const totalFactors = Object.keys(riskFactors).length;
    return totalFactors > 0 ? factorsWithData / totalFactors : 0;
  }

  /**
   * Calculate next assessment date
   * @returns {Date} Next assessment date
   */
  calculateNextAssessmentDate() {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30); // 30 days from now
    return nextDate;
  }

  /**
   * Generate mitigation strategies
   * @param {Object} riskFactors - Risk factors
   * @param {string} entityType - Entity type (property/tenant)
   * @returns {Array} Mitigation strategies
   */
  generateMitigationStrategies(riskFactors, entityType) {
    const strategies = [];

    Object.entries(riskFactors).forEach(([category, factor]) => {
      if (factor.score >= 2.0) { // Medium risk or higher
        strategies.push({
          category: category,
          riskScore: factor.score,
          priority: factor.score >= 4.0 ? 'immediate' : factor.score >= 3.0 ? 'urgent' : 'high',
          actions: this.getMitigationActions(category, factor.score, entityType),
          estimatedCost: this.estimateMitigationCost(category, factor.score),
          timeline: this.estimateMitigationTimeline(factor.score)
        });
      }
    });

    return strategies.sort((a, b) => {
      const priorityOrder = { immediate: 0, urgent: 1, high: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get mitigation actions for a risk category
   * @param {string} category - Risk category
   * @param {number} score - Risk score
   * @param {string} entityType - Entity type
   * @returns {Array} Mitigation actions
   */
  getMitigationActions(category, score, entityType) {
    const actions = {
      maintenance: [
        'Schedule preventive maintenance inspections',
        'Create maintenance budget allocation',
        'Implement equipment monitoring systems',
        'Train staff on maintenance procedures'
      ],
      churn: [
        'Implement tenant retention program',
        'Improve tenant communication channels',
        'Offer lease renewal incentives',
        'Conduct tenant satisfaction surveys'
      ],
      market: [
        'Monitor local market trends regularly',
        'Adjust rental pricing strategy',
        'Improve property marketing efforts',
        'Consider property improvements for competitiveness'
      ],
      financial: [
        'Review and optimize operating expenses',
        'Improve cash flow management',
        'Diversify income sources',
        'Implement financial monitoring systems'
      ],
      payment: [
        'Implement stricter payment policies',
        'Offer payment plan options',
        'Improve tenant financial communication',
        'Consider tenant financial assistance programs'
      ],
      behavioral: [
        'Enhance tenant screening process',
        'Implement clear lease terms and policies',
        'Improve tenant education and communication',
        'Establish tenant dispute resolution process'
      ]
    };

    return actions[category] || ['Develop customized mitigation strategy'];
  }

  /**
   * Estimate mitigation cost
   * @param {string} category - Risk category
   * @param {number} score - Risk score
   * @returns {string} Cost estimate
   */
  estimateMitigationCost(category, score) {
    const baseCosts = {
      maintenance: { low: '$1,000-5,000', medium: '$5,000-15,000', high: '$15,000+' },
      churn: { low: '$500-2,000', medium: '$2,000-10,000', high: '$10,000+' },
      market: { low: '$1,000-3,000', medium: '$3,000-10,000', high: '$10,000+' },
      financial: { low: '$2,000-5,000', medium: '$5,000-20,000', high: '$20,000+' },
      payment: { low: '$500-1,000', medium: '$1,000-5,000', high: '$5,000+' },
      behavioral: { low: '$1,000-3,000', medium: '$3,000-8,000', high: '$8,000+' }
    };

    const costs = baseCosts[category] || { low: '$1,000-5,000', medium: '$5,000-15,000', high: '$15,000+' };

    if (score >= 4.0) return costs.high;
    if (score >= 3.0) return costs.medium;
    return costs.low;
  }

  /**
   * Estimate mitigation timeline
   * @param {number} score - Risk score
   * @returns {string} Timeline estimate
   */
  estimateMitigationTimeline(score) {
    if (score >= 4.0) return '1-2 weeks';
    if (score >= 3.0) return '2-4 weeks';
    return '1-2 months';
  }

  /**
   * Create risk factor records
   * @param {string} assessmentId - Assessment ID
   * @param {Object} riskFactors - Risk factors
   */
  async createRiskFactorRecords(assessmentId, riskFactors) {
    const factorRecords = [];

    Object.entries(riskFactors).forEach(([category, factor]) => {
      Object.entries(factor.factors || []).forEach(([index, factorName]) => {
        factorRecords.push({
          assessmentId: assessmentId,
          category: category,
          factorType: factorName,
          name: this.getFactorDisplayName(factorName),
          description: this.getFactorDescription(factorName),
          score: factor.score,
          weight: factor.weight,
          impact: factor.impact,
          probability: factor.probability,
          confidence: factor.confidence,
          dataSource: 'internal_system',
          dataQuality: factor.confidence,
          trend: factor.trend,
          mitigationStatus: factor.score >= 3.0 ? 'not_started' : 'not_applicable'
        });
      });
    });

    if (factorRecords.length > 0) {
      await RiskFactor.bulkCreate(factorRecords);
    }
  }

  /**
   * Get display name for risk factor
   * @param {string} factorName - Factor name
   * @returns {string} Display name
   */
  getFactorDisplayName(factorName) {
    const names = {
      property_age: 'Property Age',
      maintenance_history: 'Maintenance History',
      vacancy_rate: 'Vacancy Rate',
      market_trend: 'Market Trend',
      revenue_stability: 'Revenue Stability',
      debt_service: 'Debt Service Coverage',
      property_size: 'Property Size',
      management_complexity: 'Management Complexity',
      building_age: 'Building Age',
      regulatory_compliance: 'Regulatory Compliance',
      renewal_likelihood: 'Renewal Likelihood',
      lease_violations: 'Lease Violations',
      payment_history: 'Payment History',
      late_payment_rate: 'Late Payment Rate',
      complaint_history: 'Complaint History',
      credit_score: 'Credit Score',
      income_stability: 'Income Stability',
      satisfaction_rating: 'Satisfaction Rating'
    };

    return names[factorName] || factorName;
  }

  /**
   * Get description for risk factor
   * @param {string} factorName - Factor name
   * @returns {string} Description
   */
  getFactorDescription(factorName) {
    const descriptions = {
      property_age: 'Age of the property affects maintenance costs and market value',
      maintenance_history: 'Historical maintenance records indicate property condition',
      vacancy_rate: 'Current vacancy rate affects revenue stability',
      market_trend: 'Local market trends impact property value and rental rates',
      revenue_stability: 'Consistency of rental income and expense management',
      debt_service: 'Ability to meet mortgage and loan payment obligations',
      property_size: 'Number of units affects management complexity and risk',
      management_complexity: 'Property type and size affect operational requirements',
      building_age: 'Building age affects compliance with modern regulations',
      regulatory_compliance: 'Adherence to local, state, and federal regulations',
      renewal_likelihood: 'Probability of tenant renewing their lease',
      lease_violations: 'Historical record of lease term violations',
      payment_history: 'Pattern of rent payment timeliness and reliability',
      late_payment_rate: 'Percentage of payments received after due date',
      complaint_history: 'Frequency and severity of tenant complaints',
      credit_score: 'Tenant creditworthiness and financial reliability',
      income_stability: 'Consistency of tenant income and employment',
      satisfaction_rating: 'Tenant satisfaction with property and services'
    };

    return descriptions[factorName] || 'Risk factor assessment based on available data';
  }

  /**
   * Update property with risk assessment data
   * @param {string} propertyId - Property ID
   * @param {Object} assessment - Risk assessment
   */
  async updatePropertyRiskData(propertyId, assessment) {
    const updateData = {
      lastRiskAssessment: assessment.assessmentDate,
      overallRiskScore: assessment.overallRiskScore,
      riskLevel: assessment.riskLevel,
      maintenanceRiskScore: assessment.riskFactors.maintenance?.score || null,
      marketRiskScore: assessment.riskFactors.market?.score || null,
      financialRiskScore: assessment.riskFactors.financial?.score || null,
      operationalRiskScore: assessment.riskFactors.operational?.score || null,
      complianceRiskScore: assessment.riskFactors.compliance?.score || null,
      nextRiskAssessment: assessment.nextAssessmentDate
    };

    await Property.update(updateData, { where: { id: propertyId } });
  }

  /**
   * Update tenant with risk assessment data
   * @param {string} tenantId - Tenant ID
   * @param {Object} assessment - Risk assessment
   */
  async updateTenantRiskData(tenantId, assessment) {
    const updateData = {
      lastRiskAssessment: assessment.assessmentDate,
      overallRiskScore: assessment.overallRiskScore,
      riskLevel: assessment.riskLevel,
      churnRiskScore: assessment.riskFactors.churn?.score || null,
      paymentRiskScore: assessment.riskFactors.payment?.score || null,
      behavioralRiskScore: assessment.riskFactors.behavioral?.score || null,
      financialRiskScore: assessment.riskFactors.financial?.score || null,
      satisfactionRiskScore: assessment.riskFactors.satisfaction?.score || null,
      nextRiskAssessment: assessment.nextAssessmentDate
    };

    await Tenant.update(updateData, { where: { id: tenantId } });
  }

  /**
   * Calculate portfolio risk from individual assessments
   * @param {Array} propertyRisks - Property risk assessments
   * @param {Array} tenantRisks - Tenant risk assessments
   * @returns {Object} Portfolio risk assessment
   */
  calculatePortfolioRisk(propertyRisks, tenantRisks) {
    const allRisks = [...propertyRisks, ...tenantRisks];

    if (allRisks.length === 0) {
      return {
        overallScore: 0,
        riskLevel: 'minimal',
        confidence: 0,
        criticalCount: 0,
        highCount: 0,
        riskFactors: {},
        mitigationStrategies: [],
        dataQuality: 0
      };
    }

    // Calculate weighted average risk score
    const totalScore = allRisks.reduce((sum, risk) => sum + risk.riskScore, 0);
    const overallScore = totalScore / allRisks.length;

    // Count risk levels
    const riskCounts = allRisks.reduce((counts, risk) => {
      counts[risk.riskLevel] = (counts[risk.riskLevel] || 0) + 1;
      return counts;
    }, {});

    const criticalCount = riskCounts.critical || 0;
    const highCount = riskCounts.high || 0;

    // Adjust overall score based on concentration of high-risk entities
    const highRiskPercentage = (criticalCount + highCount) / allRisks.length;
    const concentrationRisk = highRiskPercentage > 0.2 ? highRiskPercentage * 2 : 0;
    const adjustedScore = Math.min(overallScore + concentrationRisk, 5.0);

    return {
      overallScore: adjustedScore,
      riskLevel: this.determineRiskLevel(adjustedScore),
      confidence: 0.8, // Portfolio assessments have good confidence due to sample size
      criticalCount: criticalCount,
      highCount: highCount,
      riskFactors: {
        concentration: {
          score: concentrationRisk,
          weight: this.RISK_WEIGHTS.concentration,
          impact: 4.0,
          probability: highRiskPercentage,
          confidence: 0.9,
          trend: 'stable',
          factors: ['high_risk_concentration']
        }
      },
      mitigationStrategies: this.generatePortfolioMitigationStrategies(criticalCount, highCount, allRisks.length),
      dataQuality: 0.9
    };
  }

  /**
   * Generate portfolio-level mitigation strategies
   * @param {number} criticalCount - Number of critical risk entities
   * @param {number} highCount - Number of high risk entities
   * @param {number} totalCount - Total number of entities
   * @returns {Array} Mitigation strategies
   */
  generatePortfolioMitigationStrategies(criticalCount, highCount, totalCount) {
    const strategies = [];

    if (criticalCount > 0) {
      strategies.push({
        category: 'portfolio',
        riskScore: 4.0,
        priority: 'immediate',
        actions: [
          'Immediate intervention required for critical risk entities',
          'Allocate emergency resources for high-priority mitigation',
          'Implement enhanced monitoring for critical entities',
          'Consider professional risk management consultation'
        ],
        estimatedCost: '$10,000+',
        timeline: '1-2 weeks'
      });
    }

    if (highCount > totalCount * 0.1) {
      strategies.push({
        category: 'portfolio',
        riskScore: 3.0,
        priority: 'urgent',
        actions: [
          'Develop comprehensive risk mitigation plan',
          'Prioritize high-risk entities for intervention',
          'Implement portfolio-wide risk monitoring system',
          'Review and strengthen risk management policies'
        ],
        estimatedCost: '$5,000-15,000',
        timeline: '2-4 weeks'
      });
    }

    return strategies;
  }

  /**
   * Get risk assessment by ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object>} Risk assessment
   */
  async getRiskAssessment(assessmentId) {
    const assessment = await RiskAssessment.findByPk(assessmentId, {
      include: [{
        model: RiskFactor,
        as: 'riskFactors'
      }]
    });

    if (!assessment) {
      throw new Error('Risk assessment not found');
    }

    return assessment;
  }

  /**
   * Get risk assessments for entity
   * @param {string} entityType - Entity type (property/tenant/portfolio)
   * @param {string} entityId - Entity ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Risk assessments
   */
  async getEntityRiskAssessments(entityType, entityId, options = {}) {
    const whereClause = {
      entityType: entityType,
      entityId: entityId
    };

    if (options.assessmentType) {
      whereClause.assessmentType = options.assessmentType;
    }

    const assessments = await RiskAssessment.findAll({
      where: whereClause,
      include: [{
        model: RiskFactor,
        as: 'riskFactors'
      }],
      order: [['assessmentDate', 'DESC']],
      limit: options.limit || 10,
      offset: options.offset || 0
    });

    return assessments;
  }

  /**
   * Get risk trends for entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Risk trends
   */
  async getRiskTrends(entityType, entityId, options = {}) {
    const assessments = await this.getEntityRiskAssessments(entityType, entityId, {
      ...options,
      limit: 50 // Get more data for trend analysis
    });

    if (assessments.length < 2) {
      return {
        trend: 'insufficient_data',
        trendValue: 0,
        assessments: assessments.length,
        period: 'N/A'
      };
    }

    // Calculate trend
    const scores = assessments.map(a => a.overallRiskScore).reverse(); // Oldest first
    const recentAvg = scores.slice(-5).reduce((sum, score) => sum + score, 0) / Math.min(5, scores.length);
    const olderAvg = scores.slice(0, Math.max(1, scores.length - 5)).reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length - 5);

    const trendValue = recentAvg - olderAvg;
    let trend = 'stable';

    if (Math.abs(trendValue) > 0.5) {
      trend = trendValue > 0 ? 'worsening' : 'improving';
    }

    return {
      trend: trend,
      trendValue: Math.abs(trendValue),
      direction: trendValue > 0 ? 'increasing' : trendValue < 0 ? 'decreasing' : 'stable',
      recentAverage: recentAvg,
      olderAverage: olderAvg,
      assessments: assessments.length,
      period: `${assessments[0].assessmentDate.toISOString().split('T')[0]} to ${assessments[assessments.length - 1].assessmentDate.toISOString().split('T')[0]}`
    };
  }
}

module.exports = new RiskAssessmentService();