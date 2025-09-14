import { Request, Response, NextFunction } from 'express';
import { User, UserRole, Permission } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from './errorMiddleware';

export interface PermissionCheck {
  resource: string;
  action: string;
  scope?: string;
}

export interface RolePermissions {
  [role: string]: PermissionCheck[];
}

export class EnhancedRBACService {
  private rolePermissions: RolePermissions = {
    [UserRole.ADMIN]: [
      { resource: '*', action: '*' }, // Admin has all permissions
    ],
    [UserRole.PROPERTY_MANAGER]: [
      { resource: 'properties', action: '*' },
      { resource: 'units', action: '*' },
      { resource: 'tenants', action: '*' },
      { resource: 'maintenance', action: '*' },
      { resource: 'financial', action: 'read' },
      { resource: 'reports', action: 'read' },
    ],
    [UserRole.TENANT]: [
      { resource: 'profile', action: '*' },
      { resource: 'maintenance', action: 'create' },
      { resource: 'maintenance', action: 'read', scope: 'own' },
      { resource: 'payments', action: 'read', scope: 'own' },
      { resource: 'documents', action: 'read', scope: 'own' },
    ],
    [UserRole.VENDOR]: [
      { resource: 'work_orders', action: 'read', scope: 'assigned' },
      { resource: 'work_orders', action: 'update', scope: 'assigned' },
      { resource: 'quotes', action: 'create', scope: 'assigned' },
      { resource: 'profile', action: '*' },
    ],
    [UserRole.OWNER]: [
      { resource: 'properties', action: 'read', scope: 'own' },
      { resource: 'financial', action: '*' },
      { resource: 'reports', action: '*' },
      { resource: 'tenants', action: 'read' },
      { resource: 'maintenance', action: 'read' },
    ],
  };

  async checkPermission(user: User, permission: PermissionCheck): Promise<boolean> {
    // Check role-based permissions first
    const rolePermissions = this.rolePermissions[user.role] || [];
    if (this.hasPermission(rolePermissions, permission)) {
      return true;
    }

    // Check database permissions for granular control
    const userPermissions = await prisma.role.findMany({
      where: {
        User: {
          some: { id: user.id }
        }
      },
      include: { Permission: true }
    });

    for (const role of userPermissions) {
      for (const perm of role.Permission) {
        if (this.matchesPermission(perm, permission)) {
          return true;
        }
      }
    }

    return false;
  }

  private hasPermission(userPermissions: PermissionCheck[], required: PermissionCheck): boolean {
    return userPermissions.some(perm => {
      // Check resource match
      if (perm.resource !== '*' && perm.resource !== required.resource) {
        return false;
      }

      // Check action match
      if (perm.action !== '*' && perm.action !== required.action) {
        return false;
      }

      // Check scope match
      if (perm.scope && required.scope && perm.scope !== required.scope) {
        return false;
      }

      return true;
    });
  }

  private matchesPermission(dbPerm: Permission, required: PermissionCheck): boolean {
    // Check if database permission matches required permission
    const permResource = dbPerm.name.split(':')[0]; // Assuming format "resource:action"
    const permAction = dbPerm.name.split(':')[1];

    if (permResource !== '*' && permResource !== required.resource) {
      return false;
    }

    if (permAction !== '*' && permAction !== required.action) {
      return false;
    }

    return true;
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        Role: {
          connect: { id: roleId }
        }
      }
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        Role: {
          disconnect: { id: roleId }
        }
      }
    });
  }

  async createRole(name: string, permissions: string[]): Promise<any> {
    return prisma.role.create({
      data: {
        name,
        Permission: {
          connect: permissions.map(id => ({ id }))
        }
      },
      include: { Permission: true }
    });
  }

  async updateRolePermissions(roleId: string, permissions: string[]): Promise<any> {
    return prisma.role.update({
      where: { id: roleId },
      data: {
        Permission: {
          set: permissions.map(id => ({ id }))
        }
      },
      include: { Permission: true }
    });
  }

  async getUserPermissions(userId: string): Promise<PermissionCheck[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Role: {
          include: { Permission: true }
        }
      }
    });

    if (!user) return [];

    const permissions: PermissionCheck[] = [];

    // Add role-based permissions
    for (const role of user.Role) {
      for (const permission of role.Permission) {
        const [resource, action] = permission.name.split(':');
        permissions.push({ resource, action });
      }
    }

    return permissions;
  }

  async createPermission(name: string, description?: string): Promise<any> {
    return prisma.permission.create({
      data: { name, description }
    });
  }

  async getAllPermissions(): Promise<any[]> {
    return prisma.permission.findMany();
  }

  async getAllRoles(): Promise<any[]> {
    return prisma.role.findMany({
      include: { Permission: true, User: true }
    });
  }

  async deleteRole(roleId: string): Promise<void> {
    await prisma.role.delete({
      where: { id: roleId }
    });
  }

  async deletePermission(permissionId: string): Promise<void> {
    await prisma.permission.delete({
      where: { id: permissionId }
    });
  }

  async checkOwnership(user: User, resourceType: string, resourceId: string): Promise<boolean> {
    switch (resourceType) {
      case 'property': {
        const property = await prisma.rental.findUnique({
          where: { id: resourceId },
          select: { ownerId: true, managerId: true }
        });
        return property?.ownerId === user.id || property?.managerId === user.id;
      }

      case 'unit': {
        const unit = await prisma.rental.findFirst({
          where: { id: resourceId },
          select: { ownerId: true, managerId: true }
        });
        return unit?.ownerId === user.id || unit?.managerId === user.id;
      }

      case 'tenant':
        // Tenants can only access their own data
        return resourceId === user.id;

      case 'maintenance': {
        const maintenance = await prisma.maintenanceRequest.findUnique({
          where: { id: resourceId },
          select: { requestedById: true, rental: { select: { ownerId: true, managerId: true } } }
        });
        return maintenance?.requestedById === user.id ||
               maintenance?.rental.ownerId === user.id ||
               maintenance?.rental.managerId === user.id;
      }

      default:
        return false;
    }
  }
}

export const enhancedRBACService = new EnhancedRBACService();

// Middleware functions
export const requirePermission = (permission: PermissionCheck) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;
      if (!user) {
        return next(new AppError('Authentication required', 401));
      }

      const hasPermission = await enhancedRBACService.checkPermission(user, permission);
      if (!hasPermission) {
        return next(new AppError('Insufficient permissions', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireOwnership = (resourceType: string, resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as User;
      if (!user) {
        return next(new AppError('Authentication required', 401));
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return next(new AppError('Resource ID required', 400));
      }

      const hasOwnership = await enhancedRBACService.checkOwnership(user, resourceType, resourceId);
      if (!hasOwnership) {
        return next(new AppError('Access denied: not owner of resource', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    if (!user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new AppError(`Access denied: requires one of roles: ${allowedRoles.join(', ')}`, 403));
    }

    next();
  };
};

// Helper middleware to extract resource ID from various sources
export const extractResourceId = (source: 'params' | 'body' | 'query', key: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    let resourceId: string;

    switch (source) {
      case 'params':
        resourceId = req.params[key];
        break;
      case 'body':
        resourceId = req.body[key];
        break;
      case 'query':
        resourceId = req.query[key] as string;
        break;
    }

    if (resourceId) {
      (req as any).resourceId = resourceId;
    }

    next();
  };
};