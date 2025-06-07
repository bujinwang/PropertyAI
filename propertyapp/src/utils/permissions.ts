import { UserRole } from '@/types/auth';

/**
 * Role hierarchy for determining access levels
 * Higher array index means higher access level
 */
const ROLE_HIERARCHY: UserRole[] = ['tenant', 'propertyManager', 'admin'];

/**
 * Permission groups that define role-based access to features
 */
export const PERMISSIONS = {
  // Property management permissions
  PROPERTIES: {
    VIEW: ['tenant', 'propertyManager', 'admin'],
    MANAGE: ['propertyManager', 'admin'],
    DELETE: ['admin'],
  },
  
  // User management permissions
  USERS: {
    VIEW: ['propertyManager', 'admin'],
    MANAGE: ['admin'],
  },
  
  // Financial permissions
  FINANCES: {
    VIEW_OWN: ['tenant', 'propertyManager', 'admin'],
    VIEW_ALL: ['propertyManager', 'admin'],
    MANAGE: ['propertyManager', 'admin'],
  },
  
  // Maintenance permissions
  MAINTENANCE: {
    CREATE: ['tenant', 'propertyManager', 'admin'],
    ASSIGN: ['propertyManager', 'admin'],
    CLOSE: ['propertyManager', 'admin'],
  },
  
  // Settings permissions
  SETTINGS: {
    VIEW: ['tenant', 'propertyManager', 'admin'],
    MANAGE: ['admin'],
  },
};

/**
 * Check if a user role has specific permission
 */
export const hasPermission = (userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

/**
 * Check if a user role has at least the specified minimum role level
 * Useful for hierarchical permissions
 */
export const hasMinimumRole = (userRole: UserRole | undefined, minimumRole: UserRole): boolean => {
  if (!userRole) return false;
  
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  const minimumRoleIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  
  // User's role is at least the minimum required level
  return userRoleIndex >= minimumRoleIndex;
};

/**
 * Get all permissions available to a specific role
 */
export const getRolePermissions = (role: UserRole): Record<string, string[]> => {
  const permissions: Record<string, string[]> = {};
  
  // Iterate through all permission groups
  Object.entries(PERMISSIONS).forEach(([groupKey, group]) => {
    permissions[groupKey] = [];
    
    // Check each permission in the group
    Object.entries(group).forEach(([permKey, allowedRoles]) => {
      if (hasPermission(role, allowedRoles as UserRole[])) {
        permissions[groupKey].push(permKey);
      }
    });
  });
  
  return permissions;
}; 