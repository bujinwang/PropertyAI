const UserTemplate = require('../models/epic23/UserTemplates');
const { Op } = require('sequelize');

// TemplateService for Story 23.3
class TemplateService {
  // Save template for user/role
  static async saveTemplate(userId, templateName, layout, role) {
    const [template, created] = await UserTemplate.findOrCreate({
      where: { userId, templateName, role },
      defaults: {
        layout,
      },
    });

    if (!created) {
      template.layout = layout;
      template.updatedAt = new Date();
      await template.save();
    }

    return template;
  }

  // Get templates for user (with sharing)
  static async getTemplates(userId, role) {
    const where = { userId, role };
    const templates = await UserTemplate.findAll({ where });
    return templates;
  }

  // Get shared templates (for roles)
  static async getSharedTemplates(userId, role) {
    const where = { role };
    const templates = await UserTemplate.findAll({
      where,
      include: [{
        model: UserTemplate, // Self join or query sharedWith
        as: 'sharedTemplates',
        where: {
          sharedWith: {
            [Op.contains]: userId, // JSON array contains userId
          },
        },
      }],
    });
    return templates;
  }

  // Apply template to page (client-side, return layout JSON)
  static applyTemplate(templateLayout, availableComponents) {
    // Validate and return layout with available components
    const validatedLayout = templateLayout.filter(comp => availableComponents.includes(comp.type));
    return validatedLayout;
  }

  // Export template as PDF/CSV (stub; use jsPDF in frontend)
  static async exportTemplate(templateId, format = 'json') {
    const template = await UserTemplate.findByPk(templateId);
    if (!template) throw new Error('Template not found');

    if (format === 'pdf') {
      // Server-side PDF generation stub
      return { data: 'PDF bytes', filename: `template-${templateId}.pdf` };
    } else if (format === 'csv') {
      // CSV export stub
      return { data: 'CSV string', filename: `template-${templateId}.csv` };
    }

    return template.layout; // JSON
  }
}

module.exports = TemplateService;