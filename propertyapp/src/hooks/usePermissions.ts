import { useAuth } from '@/contexts';
import { UserRole } from '@/types/auth';
import { getRolePermissions } from '@/utils/permissions';

/**
 * Custom hook that provides permission checking functionality
 * Makes it easier to check permissions in any component
 */
export const usePermissions = () => {
  const { user, hasRole, hasPermission, hasMinimumRole } = useAuth();
  
  /**
   * Check if current user can access a specific feature
   */
  const canAccess = (feature: string, action: string): boolean => {
    if (!user?.role) return false;
    
    // Get all permissions for the user's role
    const permissions = getRolePermissions(user.role);
    
    // Check if the permission exists for this feature
    return permissions[feature]?.includes(action) || false;
  };
  
  /**
   * Get user's role or null if not authenticated
   */
  const userRole = user?.role || null;
  
  /**
   * Check if the user is an admin
   */
  const isAdmin = hasRole('admin');
  
  /**
   * Check if the user is a property manager
   */
  const isPropertyManager = hasRole('propertyManager');
  
  /**
   * Check if the user is a tenant
   */
  const isTenant = hasRole('tenant');
  
  /**
   * Check if user has at least property manager privileges
   */
  const hasManagerAccess = hasMinimumRole('propertyManager');
  
  return {
    userRole,
    isAdmin,
    isPropertyManager,
    isTenant,
    hasManagerAccess,
    canAccess,
    hasPermission,
    hasMinimumRole,
  };
}; 