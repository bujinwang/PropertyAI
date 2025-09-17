/**
 * ReportTemplate Model
 * Defines customizable report templates for AI-powered reporting
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportTemplate = sequelize.define('ReportTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'weekly', 'daily', 'custom'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  category: {
    type: DataTypes.ENUM('executive', 'operational', 'financial', 'compliance', 'custom'),
    allowNull: false,
    defaultValue: 'executive'
  },
  sections: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidSections(value) {
        if (!Array.isArray(value)) {
          throw new Error('Sections must be an array');
        }
        const validSections = [
          'portfolio-overview', 'financial-performance', 'risk-summary',
          'predictive-insights', 'actionable-recommendations', 'maintenance-overview',
          'tenant-activity', 'system-performance', 'predictive-alerts',
          'revenue-analysis', 'expense-breakdown', 'market-comparison',
          'forecast-projections', 'compliance-status', 'audit-trail'
        ];
        for (const section of value) {
          if (!validSections.includes(section)) {
            throw new Error(`Invalid section: ${section}`);
          }
        }
      }
    }
  },
  dataSources: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidDataSources(value) {
        if (!Array.isArray(value)) {
          throw new Error('Data sources must be an array');
        }
        const validSources = [
          'properties', 'tenants', 'maintenance', 'financial', 'market',
          'system-metrics', 'compliance', 'audit-logs'
        ];
        for (const source of value) {
          if (!validSources.includes(source)) {
            throw new Error(`Invalid data source: ${source}`);
          }
        }
      }
    }
  },
  visualizations: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidVisualizations(value) {
        if (!Array.isArray(value)) {
          throw new Error('Visualizations must be an array');
        }
        const validVisualizations = [
          'kpi-dashboard', 'trend-charts', 'risk-heatmap', 'maintenance-timeline',
          'tenant-churn-trends', 'revenue-trends', 'market-comparison-chart',
          'performance-metrics', 'compliance-dashboard'
        ];
        for (const visualization of value) {
          if (!validVisualizations.includes(visualization)) {
            throw new Error(`Invalid visualization: ${visualization}`);
          }
        }
      }
    }
  },
  filters: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Default filters to apply to the report'
  },
  styling: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      theme: 'default',
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336'
      },
      fonts: {
        primary: 'Roboto',
        secondary: 'Open Sans'
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this template is available to all users'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Template version for change tracking'
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Tags for categorization and search'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata for extensibility'
  }
}, {
  tableName: 'report_templates',
  indexes: [
    {
      fields: ['type', 'category']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['isActive', 'isPublic']
    },
    {
      fields: ['tags'],
      using: 'gin'
    }
  ],
  hooks: {
    beforeUpdate: (template) => {
      template.version += 1;
      template.updatedAt = new Date();
    }
  }
});

// Instance methods
ReportTemplate.prototype.getSections = function() {
  return this.sections || [];
};

ReportTemplate.prototype.getDataSources = function() {
  return this.dataSources || [];
};

ReportTemplate.prototype.getVisualizations = function() {
  return this.visualizations || [];
};

ReportTemplate.prototype.addSection = function(section) {
  if (!this.sections.includes(section)) {
    this.sections.push(section);
  }
};

ReportTemplate.prototype.removeSection = function(section) {
  const index = this.sections.indexOf(section);
  if (index > -1) {
    this.sections.splice(index, 1);
  }
};

ReportTemplate.prototype.addDataSource = function(source) {
  if (!this.dataSources.includes(source)) {
    this.dataSources.push(source);
  }
};

ReportTemplate.prototype.removeDataSource = function(source) {
  const index = this.dataSources.indexOf(source);
  if (index > -1) {
    this.dataSources.splice(index, 1);
  }
};

ReportTemplate.prototype.addVisualization = function(visualization) {
  if (!this.visualizations.includes(visualization)) {
    this.visualizations.push(visualization);
  }
};

ReportTemplate.prototype.removeVisualization = function(visualization) {
  const index = this.visualizations.indexOf(visualization);
  if (index > -1) {
    this.visualizations.splice(index, 1);
  }
};

ReportTemplate.prototype.clone = function(newName, createdBy) {
  return ReportTemplate.create({
    name: newName,
    description: this.description,
    type: this.type,
    category: this.category,
    sections: [...this.sections],
    dataSources: [...this.dataSources],
    visualizations: [...this.visualizations],
    filters: { ...this.filters },
    styling: { ...this.styling },
    isActive: true,
    isPublic: false,
    createdBy: createdBy,
    tags: [...this.tags],
    metadata: { ...this.metadata }
  });
};

ReportTemplate.prototype.toJSON = function() {
  const values = { ...this.get() };
  // Remove sensitive data if needed
  return values;
};

module.exports = ReportTemplate;