import { useAuth } from '@/contexts';
import { UserRole } from '@/types/auth';
import { Resource, Action, Permission } from '@/types/permissions';
import { getPermissionsByResource } from '@/utils/rbac';

/**
 * Custom hook that provides permission checking functionality
 * Makes it easier to check permissions in any component
 */
export const usePermissions = () => {
  const { 
    user, 
    checkRoleIs,
    hasPermission, 
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumRole,
    hasResourcePermission,
    hasResourceAccess
  } = useAuth();
  
  /**
   * Check if current user can perform an action on a resource
   */
  const canAccess = (resource: Resource, action: Action): boolean => {
    return hasResourcePermission(resource, action);
  };

  /**
   * Check if user can access a specific resource instance (by owner ID)
   */
  const canAccessResource = (
    resource: Resource, 
    resourceOwnerId?: string, 
    isAssigned?: boolean
  ): boolean => {
    return hasResourceAccess(resource, resourceOwnerId, isAssigned);
  };
  
  /**
   * Get user's role or null if not authenticated
   */
  const userRole = user?.role as UserRole || null;
  
  /**
   * Check if the user is an admin
   */
  const isAdmin = checkRoleIs(['admin']);
  
  /**
   * Check if the user is a property manager
   */
  const isPropertyManager = checkRoleIs(['propertyManager']);
  
  /**
   * Check if the user is a tenant
   */
  const isTenant = checkRoleIs(['tenant']);
  
  /**
   * Check if user has at least property manager privileges
   */
  const hasManagerAccess = hasMinimumRole('propertyManager');

  /**
   * Get all permissions for the current user, organized by resource
   */
  const getAllPermissions = (): Record<Resource, Action[]> | null => {
    if (!user?.role) return null;
    return getPermissionsByResource(user.role as UserRole);
  };
  
  return {
    userRole,
    isAdmin,
    isPropertyManager,
    isTenant,
    hasManagerAccess,
    canAccess,
    canAccessResource,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumRole,
    getAllPermissions,
  };
}; 