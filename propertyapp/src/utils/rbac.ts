import { UserRole } from '@/types/auth';
import { 
  Permission, 
  ROLE_PERMISSIONS, 
  ROLE_HIERARCHY, 
  Resource, 
  Action,
  PermissionScope,
  PERMISSION_SCOPES,
  CONTEXT_PERMISSIONS
} from '@/types/permissions';

/**
 * Check if a user has a specific permission based on their role
 * @param userRole - The role of the user
 * @param permission - The permission to check
 * @returns True if the user has the permission, false otherwise
 */
export const hasPermission = (userRole: UserRole | undefined, permission: Permission): boolean => {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  return rolePermissions.includes(permission);
};

/**
 * Check if a user has any of the specified permissions
 * @param userRole - The role of the user
 * @param permissions - Array of permissions to check
 * @returns True if the user has any of the permissions, false otherwise
 */
export const hasAnyPermission = (userRole: UserRole | undefined, permissions: Permission[]): boolean => {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  return permissions.some(permission => rolePermissions.includes(permission));
};

/**
 * Check if a user has all of the specified permissions
 * @param userRole - The role of the user
 * @param permissions - Array of permissions to check
 * @returns True if the user has all of the permissions, false otherwise
 */
export const hasAllPermissions = (userRole: UserRole | undefined, permissions: Permission[]): boolean => {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  return permissions.every(permission => rolePermissions.includes(permission));
};

/**
 * Check if a user has permission to perform a specific action on a resource
 * @param userRole - The role of the user
 * @param resource - The resource to check
 * @param action - The action to check
 * @returns True if the user has permission to perform the action, false otherwise
 */
export const hasResourcePermission = (
  userRole: UserRole | undefined, 
  resource: Resource, 
  action: Action
): boolean => {
  if (!userRole) return false;
  
  const permission = `${resource}.${action}` as Permission;
  return hasPermission(userRole, permission);
};

/**
 * Check if a user has at least the minimum role level in the hierarchy
 * @param userRole - The role of the user
 * @param minimumRole - The minimum role required
 * @returns True if the user's role is at least the minimum required level
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
 * @param role - The role to get permissions for
 * @returns List of all permissions available to the role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if a user can access a specific resource based on scope
 * @param userRole - The role of the user
 * @param resource - The resource to check
 * @param userId - The ID of the user
 * @param resourceOwnerId - The ID of the resource owner
 * @param isAssigned - Whether the resource is assigned to the user
 * @returns True if the user can access the resource, false otherwise
 */
export const hasResourceAccess = (
  userRole: UserRole | undefined,
  resource: Resource,
  userId: string,
  resourceOwnerId?: string,
  isAssigned?: boolean
): boolean => {
  if (!userRole) return false;
  
  // Get the scope for this role and resource
  const scope = PERMISSION_SCOPES[userRole][resource] || PermissionScope.NONE;
  
  switch (scope) {
    case PermissionScope.ALL:
      return true;
    case PermissionScope.OWNED:
      return resourceOwnerId ? CONTEXT_PERMISSIONS.OWN_PROPERTY(userId, resourceOwnerId) : false;
    case PermissionScope.ASSIGNED:
      return isAssigned || false;
    case PermissionScope.NONE:
    default:
      return false;
  }
};

/**
 * Get all permissions for a given role, organized by resource
 * @param role - The role to get permissions for
 * @returns Object mapping resources to arrays of actions
 */
export const getPermissionsByResource = (role: UserRole): Record<Resource, Action[]> => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  const permissionsByResource: Record<string, Action[]> = {};
  
  // Initialize empty arrays for each resource
  Object.values(Resource).forEach(resource => {
    permissionsByResource[resource] = [];
  });
  
  // Group permissions by resource
  rolePermissions.forEach(permission => {
    const [resource, action] = permission.split('.') as [Resource, Action];
    permissionsByResource[resource].push(action);
  });
  
  return permissionsByResource as Record<Resource, Action[]>;
};

/**
 * Get all permissions for the roles at or below the specified role in the hierarchy
 * Useful for admin screens that show permissions by role
 * @param maxRole - The maximum role level to include
 * @returns Object mapping roles to their permissions
 */
export const getPermissionsForRolesUpTo = (maxRole: UserRole): Record<UserRole, Permission[]> => {
  const maxRoleIndex = ROLE_HIERARCHY.indexOf(maxRole);
  const permissions: Partial<Record<UserRole, Permission[]>> = {};
  
  // Get permissions for each role up to the maximum
  ROLE_HIERARCHY.forEach((role, index) => {
    if (index <= maxRoleIndex) {
      permissions[role] = ROLE_PERMISSIONS[role];
    }
  });
  
  return permissions as Record<UserRole, Permission[]>;
};

/**
 * Get the display name for a permission
 * @param permission - The permission to get display name for
 * @returns Human-readable display name
 */
export const getPermissionDisplayName = (permission: Permission): string => {
  const [resource, action] = permission.split('.') as [Resource, Action];
  
  // Convert camelCase to Title Case with spaces
  const formatString = (str: string): string => {
    return str
      // Add space before uppercase letters
      .replace(/([A-Z])/g, ' $1')
      // Capitalize first letter
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };
  
  return `${formatString(action)} ${formatString(resource)}`;
};

/**
 * Map from user roles to display names
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Administrator',
  propertyManager: 'Property Manager',
  tenant: 'Tenant',
};