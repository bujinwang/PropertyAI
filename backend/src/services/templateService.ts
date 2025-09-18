import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTemplateData {
  userId: string;
  templateName: string;
  layout: any;
  role: string;
  isShared?: boolean;
  sharedWith?: string[];
}

export interface UpdateTemplateData {
  templateName?: string;
  layout?: any;
  role?: string;
  isShared?: boolean;
  sharedWith?: string[];
}

export class TemplateService {
  /**
   * Create a new user template
   */
  async createTemplate(data: CreateTemplateData) {
    try {
      return await prisma.userTemplate.create({
        data: {
          userId: data.userId,
          templateName: data.templateName,
          layout: data.layout,
          role: data.role,
          isShared: data.isShared || false,
          sharedWith: data.sharedWith || [],
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string) {
    try {
      return await prisma.userTemplate.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      throw new Error('Failed to fetch template');
    }
  }

  /**
   * Get all templates for a user
   */
  async getTemplatesByUser(userId: string, role?: string) {
    try {
      const whereClause: any = { userId };
      if (role) {
        whereClause.role = role;
      }

      return await prisma.userTemplate.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching templates by user:', error);
      throw new Error('Failed to fetch templates');
    }
  }

  /**
   * Get shared templates for a user (by role)
   */
  async getSharedTemplates(userId: string, role?: string) {
    try {
      const whereClause: any = { isShared: true };
      if (role) {
        whereClause.role = role;
      }

      return await prisma.userTemplate.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching shared templates:', error);
      throw new Error('Failed to fetch shared templates');
    }
  }

  /**
   * Get templates accessible to a user (own + shared)
   */
  async getAccessibleTemplates(userId: string, role?: string) {
    try {
      const whereClause: any = {
        OR: [
          { userId }, // Own templates
          { isShared: true }, // Shared templates
        ],
      };

      if (role) {
        whereClause.role = role;
      }

      return await prisma.userTemplate.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        orderBy: [
          { userId: 'asc' }, // Own templates first
          { updatedAt: 'desc' },
        ],
      });
    } catch (error) {
      console.error('Error fetching accessible templates:', error);
      throw new Error('Failed to fetch accessible templates');
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, data: UpdateTemplateData) {
    try {
      return await prisma.userTemplate.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update template');
    }
  }

  /**
   * Save template (create or update)
   */
  async saveTemplate(userId: string, templateName: string, layout: any, role: string) {
    try {
      // Check if template already exists
      const existingTemplate = await prisma.userTemplate.findUnique({
        where: {
          userId_templateName: {
            userId,
            templateName,
          },
        },
      });

      if (existingTemplate) {
        // Update existing template
        return await prisma.userTemplate.update({
          where: { id: existingTemplate.id },
          data: {
            layout,
            role,
            updatedAt: new Date(),
          },
          include: {
            user: true,
          },
        });
      } else {
        // Create new template
        return await prisma.userTemplate.create({
          data: {
            userId,
            templateName,
            layout,
            role,
          },
          include: {
            user: true,
          },
        });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw new Error('Failed to save template');
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string) {
    try {
      return await prisma.userTemplate.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete template');
    }
  }

  /**
   * Share template with users
   */
  async shareTemplate(id: string, sharedWith: string[]) {
    try {
      return await prisma.userTemplate.update({
        where: { id },
        data: {
          isShared: true,
          sharedWith,
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error sharing template:', error);
      throw new Error('Failed to share template');
    }
  }

  /**
   * Unshare template
   */
  async unshareTemplate(id: string) {
    try {
      return await prisma.userTemplate.update({
        where: { id },
        data: {
          isShared: false,
          sharedWith: [],
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error unsharing template:', error);
      throw new Error('Failed to unshare template');
    }
  }

  /**
   * Get templates by role
   */
  async getTemplatesByRole(role: string) {
    try {
      return await prisma.userTemplate.findMany({
        where: { role },
        include: {
          user: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching templates by role:', error);
      throw new Error('Failed to fetch templates by role');
    }
  }

  /**
   * Validate template layout
   */
  validateTemplateLayout(layout: any, availableComponents: string[]): boolean {
    try {
      if (!Array.isArray(layout)) {
        return false;
      }

      // Check if all components in layout are available
      return layout.every((component: any) =>
        component &&
        component.type &&
        availableComponents.includes(component.type)
      );
    } catch (error) {
      console.error('Error validating template layout:', error);
      return false;
    }
  }

  /**
   * Apply template layout (validate and return)
   */
  applyTemplateLayout(layout: any, availableComponents: string[]) {
    try {
      if (!this.validateTemplateLayout(layout, availableComponents)) {
        throw new Error('Invalid template layout');
      }

      // Return validated layout
      return layout;
    } catch (error) {
      console.error('Error applying template layout:', error);
      throw new Error('Failed to apply template layout');
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats() {
    try {
      const stats = await prisma.userTemplate.groupBy({
        by: ['role', 'isShared'],
        _count: {
          id: true,
        },
      });

      return stats;
    } catch (error) {
      console.error('Error fetching template stats:', error);
      throw new Error('Failed to fetch template statistics');
    }
  }

  /**
   * Search templates by name
   */
  async searchTemplates(query: string, userId?: string) {
    try {
      const whereClause: any = {
        templateName: {
          contains: query,
          mode: 'insensitive',
        },
      };

      if (userId) {
        whereClause.OR = [
          { userId }, // Own templates
          { isShared: true }, // Shared templates
        ];
      } else {
        whereClause.isShared = true; // Only shared templates if no user specified
      }

      return await prisma.userTemplate.findMany({
        where: whereClause,
        include: {
          user: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error searching templates:', error);
      throw new Error('Failed to search templates');
    }
  }
}

export default new TemplateService();
