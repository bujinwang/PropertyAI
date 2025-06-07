import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts';
import { UserRole } from '@/types/auth';

interface PermissionGateProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  minimumRole?: UserRole;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * Can check against specific roles or a minimum role level
 * Renders nothing or an optional fallback if user doesn't have permission
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  allowedRoles,
  minimumRole,
  fallback = null,
}) => {
  const { user, hasPermission, hasMinimumRole } = useAuth();
  
  // If no user, always render fallback
  if (!user) {
    return <>{fallback}</>;
  }
  
  // Check permissions based on provided criteria
  let hasAccess = false;
  
  // If allowedRoles is provided, check against those
  if (allowedRoles) {
    hasAccess = hasPermission(allowedRoles);
  }
  // If minimumRole is provided, check against minimum role level
  else if (minimumRole) {
    hasAccess = hasMinimumRole(minimumRole);
  }
  // If neither check is specified, always grant access
  else {
    hasAccess = true;
  }
  
  // Render children or fallback based on access
  return <>{hasAccess ? children : fallback}</>;
}; 