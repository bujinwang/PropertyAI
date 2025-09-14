'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create RiskAssessment table
    await queryInterface.createTable('risk_assessments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      entityType: {
        type: Sequelize.ENUM('property', 'tenant', 'portfolio'),
        allowNull: false,
        comment: 'Type of entity being assessed'
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID of the property, tenant, or portfolio'
      },
      assessmentType: {
        type: Sequelize.ENUM('comprehensive', 'maintenance', 'churn', 'market', 'financial', 'operational', 'compliance'),
        allowNull: false,
        comment: 'Type of risk assessment performed'
      },
      overallRiskScore: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 5.0
        },
        comment: 'Overall risk score (0.0-5.0 scale)'
      },
      riskLevel: {
        type: Sequelize.ENUM('minimal', 'low', 'medium', 'high', 'critical'),
        allowNull: false,
        comment: 'Risk severity level'
      },
      confidence: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 1.0
        },
        comment: 'Confidence level in the assessment (0.0-1.0)'
      },
      riskFactors: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Detailed risk factors with scores and weights'
      },
      mitigationStrategies: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Recommended mitigation strategies'
      },
      trendData: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Historical risk trend data for forecasting'
      },
      alertsTriggered: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'List of alerts triggered by this assessment'
      },
      assessmentDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Date when assessment was performed'
      },
      nextAssessmentDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Scheduled date for next assessment'
      },
      dataQuality: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 1.0
        },
        comment: 'Quality score of input data used for assessment'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata about the assessment'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create indexes for RiskAssessment table
    await queryInterface.addIndex('risk_assessments', ['entityType', 'entityId'], {
      name: 'idx_risk_assessment_entity'
    });
    await queryInterface.addIndex('risk_assessments', ['assessmentType'], {
      name: 'idx_risk_assessment_type'
    });
    await queryInterface.addIndex('risk_assessments', ['riskLevel'], {
      name: 'idx_risk_assessment_level'
    });
    await queryInterface.addIndex('risk_assessments', ['assessmentDate'], {
      name: 'idx_risk_assessment_date'
    });
    await queryInterface.addIndex('risk_assessments', ['overallRiskScore'], {
      name: 'idx_risk_assessment_score'
    });

    // Create RiskFactor table
    await queryInterface.createTable('risk_factors', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      assessmentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'risk_assessments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Reference to the risk assessment this factor belongs to'
      },
      category: {
        type: Sequelize.ENUM(
          'maintenance',
          'churn',
          'market',
          'financial',
          'operational',
          'compliance',
          'behavioral',
          'payment',
          'satisfaction',
          'concentration'
        ),
        allowNull: false,
        comment: 'Risk category this factor belongs to'
      },
      factorType: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Specific type of risk factor (e.g., "equipment_age", "payment_delays")'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Human-readable name of the risk factor'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the risk factor'
      },
      score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 5.0
        },
        comment: 'Risk score for this specific factor (0.0-5.0 scale)'
      },
      weight: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 1.0
        },
        comment: 'Weight of this factor in overall assessment (0.0-1.0)'
      },
      impact: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 5.0
        },
        comment: 'Potential impact if this risk materializes (0.0-5.0 scale)'
      },
      probability: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 1.0
        },
        comment: 'Probability of this risk occurring (0.0-1.0)'
      },
      confidence: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 1.0
        },
        comment: 'Confidence level in this factor assessment'
      },
      dataSource: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Source of data used for this factor assessment'
      },
      dataQuality: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0.0,
          max: 1.0
        },
        comment: 'Quality score of data used for this factor'
      },
      trend: {
        type: Sequelize.ENUM('improving', 'stable', 'worsening', 'unknown'),
        allowNull: false,
        defaultValue: 'unknown',
        comment: 'Trend direction for this risk factor'
      },
      trendValue: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Quantitative value representing the trend (e.g., percentage change)'
      },
      mitigationStatus: {
        type: Sequelize.ENUM('not_started', 'in_progress', 'completed', 'not_applicable'),
        allowNull: false,
        defaultValue: 'not_started',
        comment: 'Current status of mitigation efforts for this factor'
      },
      mitigationNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notes about mitigation efforts or recommendations'
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Last time this factor was updated'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional metadata specific to this risk factor'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create indexes for RiskFactor table
    await queryInterface.addIndex('risk_factors', ['assessmentId'], {
      name: 'idx_risk_factor_assessment'
    });
    await queryInterface.addIndex('risk_factors', ['category'], {
      name: 'idx_risk_factor_category'
    });
    await queryInterface.addIndex('risk_factors', ['factorType'], {
      name: 'idx_risk_factor_type'
    });
    await queryInterface.addIndex('risk_factors', ['score'], {
      name: 'idx_risk_factor_score'
    });
    await queryInterface.addIndex('risk_factors', ['trend'], {
      name: 'idx_risk_factor_trend'
    });
    await queryInterface.addIndex('risk_factors', ['mitigationStatus'], {
      name: 'idx_risk_factor_mitigation'
    });

    // Add risk-related fields to Property table
    await queryInterface.addColumn('properties', 'lastRiskAssessment', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date of last comprehensive risk assessment'
    });

    await queryInterface.addColumn('properties', 'overallRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Current overall risk score (0.0-5.0 scale)'
    });

    await queryInterface.addColumn('properties', 'riskLevel', {
      type: Sequelize.ENUM('minimal', 'low', 'medium', 'high', 'critical'),
      allowNull: true,
      comment: 'Current risk severity level'
    });

    await queryInterface.addColumn('properties', 'maintenanceRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Maintenance-related risk score'
    });

    await queryInterface.addColumn('properties', 'marketRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Market-related risk score'
    });

    await queryInterface.addColumn('properties', 'financialRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Financial risk score'
    });

    await queryInterface.addColumn('properties', 'operationalRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Operational risk score'
    });

    await queryInterface.addColumn('properties', 'complianceRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Compliance-related risk score'
    });

    await queryInterface.addColumn('properties', 'riskTrend', {
      type: Sequelize.ENUM('improving', 'stable', 'worsening'),
      allowNull: true,
      comment: 'Overall risk trend direction'
    });

    await queryInterface.addColumn('properties', 'riskTrendValue', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Quantitative risk trend value (percentage change)'
    });

    await queryInterface.addColumn('properties', 'nextRiskAssessment', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Scheduled date for next risk assessment'
    });

    await queryInterface.addColumn('properties', 'criticalAlertsCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of active critical risk alerts'
    });

    await queryInterface.addColumn('properties', 'highAlertsCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of active high risk alerts'
    });

    await queryInterface.addColumn('properties', 'riskMetadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Additional risk-related metadata and historical data'
    });

    // Add risk-related fields to Tenant table
    await queryInterface.addColumn('tenants', 'lastRiskAssessment', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date of last comprehensive risk assessment'
    });

    await queryInterface.addColumn('tenants', 'overallRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Current overall risk score (0.0-5.0 scale)'
    });

    await queryInterface.addColumn('tenants', 'riskLevel', {
      type: Sequelize.ENUM('minimal', 'low', 'medium', 'high', 'critical'),
      allowNull: true,
      comment: 'Current risk severity level'
    });

    await queryInterface.addColumn('tenants', 'churnRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Churn probability risk score'
    });

    await queryInterface.addColumn('tenants', 'paymentRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Payment reliability risk score'
    });

    await queryInterface.addColumn('tenants', 'behavioralRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Behavioral/compliance risk score'
    });

    await queryInterface.addColumn('tenants', 'financialRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Financial stability risk score'
    });

    await queryInterface.addColumn('tenants', 'satisfactionRiskScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'Tenant satisfaction risk score'
    });

    await queryInterface.addColumn('tenants', 'riskTrend', {
      type: Sequelize.ENUM('improving', 'stable', 'worsening'),
      allowNull: true,
      comment: 'Overall risk trend direction'
    });

    await queryInterface.addColumn('tenants', 'riskTrendValue', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Quantitative risk trend value (percentage change)'
    });

    await queryInterface.addColumn('tenants', 'nextRiskAssessment', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Scheduled date for next risk assessment'
    });

    await queryInterface.addColumn('tenants', 'criticalAlertsCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of active critical risk alerts'
    });

    await queryInterface.addColumn('tenants', 'highAlertsCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of active high risk alerts'
    });

    await queryInterface.addColumn('tenants', 'paymentHistory', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Historical payment data for risk assessment'
    });

    await queryInterface.addColumn('tenants', 'leaseViolations', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Record of lease violations and incidents'
    });

    await queryInterface.addColumn('tenants', 'complaintHistory', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Historical complaint and maintenance request data'
    });

    await queryInterface.addColumn('tenants', 'renewalLikelihood', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 1.0
      },
      comment: 'Probability of lease renewal (0.0-1.0)'
    });

    await queryInterface.addColumn('tenants', 'marketSatisfaction', {
      type: Sequelize.DECIMAL(3, 1),
      allowNull: true,
      validate: {
        min: 1.0,
        max: 5.0
      },
      comment: 'Tenant satisfaction rating (1.0-5.0 scale)'
    });

    await queryInterface.addColumn('tenants', 'riskMetadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Additional risk-related metadata and historical data'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove risk-related fields from Tenant table
    await queryInterface.removeColumn('tenants', 'lastRiskAssessment');
    await queryInterface.removeColumn('tenants', 'overallRiskScore');
    await queryInterface.removeColumn('tenants', 'riskLevel');
    await queryInterface.removeColumn('tenants', 'churnRiskScore');
    await queryInterface.removeColumn('tenants', 'paymentRiskScore');
    await queryInterface.removeColumn('tenants', 'behavioralRiskScore');
    await queryInterface.removeColumn('tenants', 'financialRiskScore');
    await queryInterface.removeColumn('tenants', 'satisfactionRiskScore');
    await queryInterface.removeColumn('tenants', 'riskTrend');
    await queryInterface.removeColumn('tenants', 'riskTrendValue');
    await queryInterface.removeColumn('tenants', 'nextRiskAssessment');
    await queryInterface.removeColumn('tenants', 'criticalAlertsCount');
    await queryInterface.removeColumn('tenants', 'highAlertsCount');
    await queryInterface.removeColumn('tenants', 'paymentHistory');
    await queryInterface.removeColumn('tenants', 'leaseViolations');
    await queryInterface.removeColumn('tenants', 'complaintHistory');
    await queryInterface.removeColumn('tenants', 'renewalLikelihood');
    await queryInterface.removeColumn('tenants', 'marketSatisfaction');
    await queryInterface.removeColumn('tenants', 'riskMetadata');

    // Remove risk-related fields from Property table
    await queryInterface.removeColumn('properties', 'lastRiskAssessment');
    await queryInterface.removeColumn('properties', 'overallRiskScore');
    await queryInterface.removeColumn('properties', 'riskLevel');
    await queryInterface.removeColumn('properties', 'maintenanceRiskScore');
    await queryInterface.removeColumn('properties', 'marketRiskScore');
    await queryInterface.removeColumn('properties', 'financialRiskScore');
    await queryInterface.removeColumn('properties', 'operationalRiskScore');
    await queryInterface.removeColumn('properties', 'complianceRiskScore');
    await queryInterface.removeColumn('properties', 'riskTrend');
    await queryInterface.removeColumn('properties', 'riskTrendValue');
    await queryInterface.removeColumn('properties', 'nextRiskAssessment');
    await queryInterface.removeColumn('properties', 'criticalAlertsCount');
    await queryInterface.removeColumn('properties', 'highAlertsCount');
    await queryInterface.removeColumn('properties', 'riskMetadata');

    // Drop RiskFactor table
    await queryInterface.dropTable('risk_factors');

    // Drop RiskAssessment table
    await queryInterface.dropTable('risk_assessments');
  }
};