import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts';
import { UserRole } from '@/types/auth';
import { Permission, Resource, Action } from '@/types/permissions';

interface PermissionGateProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  minimumRole?: UserRole;
  permissions?: Permission[];
  anyPermission?: Permission[];
  resource?: Resource;
  action?: Action;
  resourceOwnerId?: string;
  isAssignedResource?: boolean;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * Can check against:
 * - Specific roles (allowedRoles)
 * - A minimum role level (minimumRole)
 * - Specific permissions (permissions - must have ALL)
 * - Any of the specified permissions (anyPermission - must have AT LEAST ONE)
 * - Permission to access a specific resource (resource, action)
 * - Permission to access a resource based on ownership (resource, resourceOwnerId, isAssignedResource)
 * 
 * Renders nothing or an optional fallback if user doesn't have permission
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  allowedRoles,
  minimumRole,
  permissions,
  anyPermission,
  resource,
  action,
  resourceOwnerId,
  isAssignedResource,
  fallback = null,
}) => {
  const { 
    user,
    checkRoleIs,
    hasMinimumRole,
    hasAllPermissions,
    hasAnyPermission,
    hasResourcePermission,
    hasResourceAccess
  } = useAuth();
  
  // If no user, always render fallback
  if (!user) {
    return <>{fallback}</>;
  }
  
  // Check permissions based on provided criteria
  let hasAccess = false;
  
  // If allowedRoles is provided, check against those
  if (allowedRoles) {
    hasAccess = checkRoleIs(allowedRoles);
  }
  // If minimumRole is provided, check against minimum role level
  else if (minimumRole) {
    hasAccess = hasMinimumRole(minimumRole);
  }
  // If permissions is provided, check if user has all the permissions
  else if (permissions) {
    hasAccess = hasAllPermissions(permissions);
  }
  // If anyPermission is provided, check if user has any of the permissions
  else if (anyPermission) {
    hasAccess = hasAnyPermission(anyPermission);
  }
  // If resource and action are provided, check if user has permission for that action on the resource
  else if (resource && action) {
    hasAccess = hasResourcePermission(resource, action);
  }
  // If resource and resourceOwnerId are provided, check if user can access the resource
  else if (resource) {
    hasAccess = hasResourceAccess(resource, resourceOwnerId, isAssignedResource);
  }
  // If neither check is specified, always grant access
  else {
    hasAccess = true;
  }
  
  // Render children or fallback based on access
  return <>{hasAccess ? children : fallback}</>;
}; 