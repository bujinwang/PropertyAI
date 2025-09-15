/**
 * Feedback Model for Epic 21 User Feedback Collection
 * Advanced Analytics and AI Insights Features
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // User information
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },

  userType: {
    type: DataTypes.ENUM('property_manager', 'maintenance_staff', 'leasing_agent', 'investor', 'executive', 'other'),
    allowNull: false
  },

  // Feedback context
  feature: {
    type: DataTypes.ENUM(
      'predictive_maintenance',
      'tenant_churn_prediction',
      'market_trend_integration',
      'ai_powered_reporting',
      'risk_assessment_dashboard',
      'overall_experience'
    ),
    allowNull: false
  },

  feedbackType: {
    type: DataTypes.ENUM('bug_report', 'feature_request', 'usability_feedback', 'performance_feedback', 'general_feedback'),
    allowNull: false
  },

  // Feedback content
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },

  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  // Categorization
  category: {
    type: DataTypes.ENUM(
      'accuracy',
      'usability',
      'performance',
      'functionality',
      'design',
      'integration',
      'data_quality',
      'other'
    ),
    allowNull: false
  },

  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },

  // Status tracking
  status: {
    type: DataTypes.ENUM('new', 'acknowledged', 'in_review', 'addressed', 'closed'),
    defaultValue: 'new'
  },

  // Metadata
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true
  },

  url: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },

  sessionId: {
    type: DataTypes.UUID,
    allowNull: true
  },

  // Timestamps
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'feedback',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['feature']
    },
    {
      fields: ['feedbackType']
    },
    {
      fields: ['category']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['rating']
    }
  ]
});

// Instance methods
Feedback.prototype.acknowledge = function() {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  return this.save();
};

Feedback.prototype.resolve = function() {
  this.status = 'addressed';
  this.resolvedAt = new Date();
  return this.save();
};

Feedback.prototype.close = function() {
  this.status = 'closed';
  return this.save();
};

// Class methods
Feedback.getFeedbackStats = async function(feature = null, days = 30) {
  const whereClause = feature ? { feature } : {};

  // Calculate date range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  whereClause.createdAt = {
    [sequelize.Op.gte]: startDate
  };

  const feedbacks = await this.findAll({
    where: whereClause,
    attributes: [
      'feature',
      'rating',
      'category',
      'priority',
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['feature', 'rating', 'category', 'priority', 'status']
  });

  return feedbacks;
};

Feedback.getAverageRating = async function(feature = null, days = 30) {
  const whereClause = feature ? { feature } : {};

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  whereClause.createdAt = {
    [sequelize.Op.gte]: startDate
  };

  const result = await this.findAll({
    where: whereClause,
    attributes: [
      'feature',
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalFeedback']
    ],
    group: ['feature']
  });

  return result;
};

module.exports = Feedback;