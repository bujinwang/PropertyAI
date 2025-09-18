#!/usr/bin/env node

/**
 * Migration Analyzer for Sequelize to Prisma
 * Analyzes differences between Sequelize models and Prisma schema
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database-legacy');

class MigrationAnalyzer {
  constructor() {
    this.sequelizeModels = {};
    this.prismaModels = {};
    this.analysis = {
      models: {},
      differences: [],
      recommendations: []
    };
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async loadSequelizeModels() {
    this.log('Loading Sequelize models...');
    const modelsDir = path.join(__dirname, '..', 'src', 'models');

    const modelFiles = fs.readdirSync(modelsDir)
      .filter(file => file.endsWith('.js') && !file.includes('migration') && !file.includes('seed'))
      .map(file => path.join(modelsDir, file));

    for (const modelFile of modelFiles) {
      try {
        const model = require(modelFile);
        if (model && model.name) {
          this.sequelizeModels[model.name] = {
            file: modelFile,
            model: model,
            attributes: model.rawAttributes || {},
            associations: []
          };
        }
      } catch (error) {
        this.log(`Warning: Could not load model ${modelFile}: ${error.message}`);
      }
    }

    this.log(`✅ Loaded ${Object.keys(this.sequelizeModels).length} Sequelize models`);
  }

  async loadPrismaSchema() {
    this.log('Loading Prisma schema...');
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

    if (!fs.existsSync(schemaPath)) {
      throw new Error('Prisma schema not found');
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const modelRegex = /model (\w+) \{([^}]+)\}/g;
    let match;

    while ((match = modelRegex.exec(schemaContent)) !== null) {
      const modelName = match[1];
      const modelContent = match[2];

      this.prismaModels[modelName] = {
        content: modelContent,
        fields: this.parsePrismaFields(modelContent)
      };
    }

    this.log(`✅ Loaded ${Object.keys(this.prismaModels).length} Prisma models`);
  }

  parsePrismaFields(content) {
    const fields = {};
    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));

    for (const line of lines) {
      const fieldMatch = line.match(/^(\w+)\s+(.+)$/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        fields[fieldName] = {
          type: fieldType,
          required: !fieldType.includes('?'),
          isId: fieldType.includes('@id'),
          isUnique: fieldType.includes('@unique'),
          default: fieldType.match(/@default\(([^)]+)\)/)?.[1]
        };
      }
    }

    return fields;
  }

  async analyzeModelDifferences() {
    this.log('Analyzing model differences...');

    const allModels = new Set([
      ...Object.keys(this.sequelizeModels),
      ...Object.keys(this.prismaModels)
    ]);

    for (const modelName of allModels) {
      const sequelizeModel = this.sequelizeModels[modelName];
      const prismaModel = this.prismaModels[modelName];

      this.analysis.models[modelName] = {
        existsInSequelize: !!sequelizeModel,
        existsInPrisma: !!prismaModel,
        differences: []
      };

      if (!sequelizeModel) {
        this.analysis.differences.push({
          type: 'missing_sequelize',
          model: modelName,
          description: `Model ${modelName} exists in Prisma but not in Sequelize`
        });
        continue;
      }

      if (!prismaModel) {
        this.analysis.differences.push({
          type: 'missing_prisma',
          model: modelName,
          description: `Model ${modelName} exists in Sequelize but not in Prisma`
        });
        continue;
      }

      // Compare fields
      await this.compareModelFields(modelName, sequelizeModel, prismaModel);
    }
  }

  async compareModelFields(modelName, sequelizeModel, prismaModel) {
    const sequelizeFields = Object.keys(sequelizeModel.attributes);
    const prismaFields = Object.keys(prismaModel.fields);

    const allFields = new Set([...sequelizeFields, ...prismaFields]);

    for (const fieldName of allFields) {
      const sequelizeField = sequelizeModel.attributes[fieldName];
      const prismaField = prismaModel.fields[fieldName];

      if (!sequelizeField) {
        this.analysis.differences.push({
          type: 'field_missing_sequelize',
          model: modelName,
          field: fieldName,
          description: `Field ${fieldName} exists in Prisma but not in Sequelize`
        });
        continue;
      }

      if (!prismaField) {
        this.analysis.differences.push({
          type: 'field_missing_prisma',
          model: modelName,
          field: fieldName,
          description: `Field ${fieldName} exists in Sequelize but not in Prisma`
        });
        continue;
      }

      // Compare field types
      const typeDiff = this.compareFieldTypes(fieldName, sequelizeField, prismaField);
      if (typeDiff) {
        this.analysis.differences.push({
          type: 'field_type_mismatch',
          model: modelName,
          field: fieldName,
          description: typeDiff
        });
      }
    }
  }

  compareFieldTypes(fieldName, sequelizeField, prismaField) {
    const sequelizeType = this.mapSequelizeType(sequelizeField.type);
    const prismaType = this.mapPrismaType(prismaField.type);

    if (sequelizeType !== prismaType) {
      return `Field ${fieldName}: Sequelize type ${sequelizeType} vs Prisma type ${prismaType}`;
    }

    // Check nullability
    const sequelizeRequired = !sequelizeField.allowNull;
    const prismaRequired = prismaField.required;

    if (sequelizeRequired !== prismaRequired) {
      return `Field ${fieldName}: Nullability mismatch (Sequelize: ${sequelizeRequired ? 'required' : 'optional'}, Prisma: ${prismaRequired ? 'required' : 'optional'})`;
    }

    return null;
  }

  mapSequelizeType(sequelizeType) {
    if (!sequelizeType) return 'unknown';

    const typeString = sequelizeType.toString().toLowerCase();

    if (typeString.includes('uuid')) return 'String';
    if (typeString.includes('varchar') || typeString.includes('text')) return 'String';
    if (typeString.includes('integer') || typeString.includes('int')) return 'Int';
    if (typeString.includes('decimal') || typeString.includes('float')) return 'Float';
    if (typeString.includes('boolean')) return 'Boolean';
    if (typeString.includes('date')) return 'DateTime';
    if (typeString.includes('json')) return 'Json';

    return typeString;
  }

  mapPrismaType(prismaType) {
    // Remove modifiers and constraints
    const cleanType = prismaType
      .replace(/\?.*/, '') // Remove optional marker
      .replace(/@.*/, '') // Remove constraints
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Extract base type
    const baseType = cleanType.split(' ')[0];
    return baseType;
  }

  generateRecommendations() {
    this.log('Generating migration recommendations...');

    // Missing models
    const missingInSequelize = this.analysis.differences.filter(d => d.type === 'missing_sequelize');
    const missingInPrisma = this.analysis.differences.filter(d => d.type === 'missing_prisma');

    if (missingInSequelize.length > 0) {
      this.analysis.recommendations.push({
        priority: 'high',
        action: 'create_sequelize_models',
        description: `Create ${missingInSequelize.length} missing Sequelize models`,
        items: missingInSequelize.map(d => d.model)
      });
    }

    if (missingInPrisma.length > 0) {
      this.analysis.recommendations.push({
        priority: 'high',
        action: 'create_prisma_models',
        description: `Create ${missingInPrisma.length} missing Prisma models`,
        items: missingInPrisma.map(d => d.model)
      });
    }

    // Field differences
    const fieldDifferences = this.analysis.differences.filter(d =>
      d.type.includes('field_missing') || d.type === 'field_type_mismatch'
    );

    if (fieldDifferences.length > 0) {
      this.analysis.recommendations.push({
        priority: 'medium',
        action: 'resolve_field_differences',
        description: `Resolve ${fieldDifferences.length} field differences`,
        items: fieldDifferences.map(d => `${d.model}.${d.field}: ${d.description}`)
      });
    }

    // Migration order
    this.analysis.recommendations.push({
      priority: 'low',
      action: 'migration_order',
      description: 'Suggested migration order: User, Property, Rental, then supporting models',
      items: ['User', 'Property', 'Rental', 'Lease', 'Transaction', 'MaintenanceRequest']
    });
  }

  async saveAnalysis() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const analysisDir = path.join(__dirname, '..', 'backups', 'analysis');
    const analysisPath = path.join(analysisDir, `migration-analysis-${timestamp}.json`);

    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir, { recursive: true });
    }

    fs.writeFileSync(analysisPath, JSON.stringify(this.analysis, null, 2));

    this.log(`✅ Analysis saved to: ${analysisPath}`);
    return analysisPath;
  }

  printSummary() {
    console.log('\n📊 Migration Analysis Summary');
    console.log('=' .repeat(50));

    console.log(`\nModels Analysis:`);
    console.log(`- Sequelize models: ${Object.keys(this.sequelizeModels).length}`);
    console.log(`- Prisma models: ${Object.keys(this.prismaModels).length}`);
    console.log(`- Total differences: ${this.analysis.differences.length}`);

    console.log(`\nDifferences by type:`);
    const diffTypes = {};
    this.analysis.differences.forEach(diff => {
      diffTypes[diff.type] = (diffTypes[diff.type] || 0) + 1;
    });

    Object.entries(diffTypes).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });

    console.log(`\nRecommendations:`);
    this.analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
    });
  }

  async run() {
    try {
      this.log('🚀 Starting migration analysis...');

      await this.loadSequelizeModels();
      await this.loadPrismaSchema();
      await this.analyzeModelDifferences();
      this.generateRecommendations();

      const analysisPath = await this.saveAnalysis();
      this.printSummary();

      this.log('🎉 Migration analysis completed!');
      this.log(`📁 Analysis saved to: ${analysisPath}`);

      // Close database connection
      await sequelize.close();

    } catch (error) {
      this.log(`💥 Analysis failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new MigrationAnalyzer();
  analyzer.run();
}

module.exports = MigrationAnalyzer;