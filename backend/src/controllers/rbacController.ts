import { Request, Response, NextFunction } from 'express';
import { enhancedRBACService } from '../middleware/enhancedRBACMiddleware';
import { AppError } from '../middleware/errorMiddleware';

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await enhancedRBACService.getAllRoles();
    res.json({ data: roles });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      throw new AppError('Role name is required', 400);
    }

    const role = await enhancedRBACService.createRole(name, permissions || []);
    res.status(201).json({ data: role });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    const role = await enhancedRBACService.updateRolePermissions(id, permissions || []);
    res.json({ data: role });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Note: In a real implementation, you'd want to check if the role is in use
    // and handle cascading deletes appropriately
    await enhancedRBACService.deleteRole(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await enhancedRBACService.getAllPermissions();
    res.json({ data: permissions });
  } catch (error) {
    next(error);
  }
};

export const createPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError('Permission name is required', 400);
    }

    const permission = await enhancedRBACService.createPermission(name, description);
    res.status(201).json({ data: permission });
  } catch (error) {
    next(error);
  }
};

export const assignRoleToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      throw new AppError('User ID and Role ID are required', 400);
    }

    await enhancedRBACService.assignRoleToUser(userId, roleId);
    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    next(error);
  }
};

export const removeRoleFromUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      throw new AppError('User ID and Role ID are required', 400);
    }

    await enhancedRBACService.removeRoleFromUser(userId, roleId);
    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const permissions = await enhancedRBACService.getUserPermissions(userId);
    res.json({ data: permissions });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const permissions = await enhancedRBACService.getUserPermissions(userId);
    res.json({ data: permissions });
  } catch (error) {
    next(error);
  }
};

export const checkPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { resource, action, scope } = req.body;

    if (!resource || !action) {
      throw new AppError('Resource and action are required', 400);
    }

    const hasPermission = await enhancedRBACService.checkPermission(user, {
      resource,
      action,
      scope,
    });

    res.json({
      data: {
        hasPermission,
        userId: user.id,
        resource,
        action,
        scope,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const checkOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { resourceType, resourceId } = req.body;

    if (!resourceType || !resourceId) {
      throw new AppError('Resource type and ID are required', 400);
    }

    const hasOwnership = await enhancedRBACService.checkOwnership(user, resourceType, resourceId);

    res.json({
      data: {
        hasOwnership,
        userId: user.id,
        resourceType,
        resourceId,
      }
    });
  } catch (error) {
    next(error);
  }
};