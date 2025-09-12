import { User, Role } from '../services/dashboardService';

// Permission cache to avoid repeated API calls
class PermissionCache {
  private userPermissions: Map<string, string[]> = new Map();
  private userRoles: Map<string, Role> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  setUserPermissions(userId: string, permissions: string[], role?: Role) {
    this.userPermissions.set(userId, permissions);
    this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION);
    if (role) {
      this.userRoles.set(userId, role);
    }
  }

  getUserPermissions(userId: string): string[] | null {
    const expiry = this.cacheExpiry.get(userId);
    if (!expiry || Date.now() > expiry) {
      this.invalidateUser(userId);
      return null;
    }
    return this.userPermissions.get(userId) || null;
  }

  getUserRole(userId: string): Role | null {
    const expiry = this.cacheExpiry.get(userId);
    if (!expiry || Date.now() > expiry) {
      this.invalidateUser(userId);
      return null;
    }
    return this.userRoles.get(userId) || null;
  }

  invalidateUser(userId: string) {
    this.userPermissions.delete(userId);
    this.userRoles.delete(userId);
    this.cacheExpiry.delete(userId);
  }

  clear() {
    this.userPermissions.clear();
    this.userRoles.clear();
    this.cacheExpiry.clear();
  }
}

const permissionCache = new PermissionCache();

// Permission checking utilities
export const permissionUtils = {
  // Check if user has a specific permission
  hasPermission: (user: User | null, permission: string): boolean => {
    if (!user) return false;

    // Check cache first
    let permissions = permissionCache.getUserPermissions(user.id);
    if (!permissions) {
      // If not in cache, use user's permissions directly
      // In a real app, this would fetch from API if needed
      permissions = user.roleId ? [] : []; // Placeholder - would need to fetch role permissions
    }

    return permissions.includes(permission);
  },

  // Check if user has any of the permissions
  hasAnyPermission: (user: User | null, permissions: string[]): boolean => {
    return permissions.some(permission => permissionUtils.hasPermission(user, permission));
  },

  // Check if user has all of the permissions
  hasAllPermissions: (user: User | null, permissions: string[]): boolean => {
    return permissions.every(permission => permissionUtils.hasPermission(user, permission));
  },

  // Check if user can access a resource with specific action
  canAccess: (user: User | null, resource: string, action: string): boolean => {
    return permissionUtils.hasPermission(user, `${resource}:${action}`);
  },

  // Get user's role level for hierarchy checks
  getRoleLevel: (user: User | null): number => {
    if (!user) return 0;

    const roleLevel = {
      'tenant': 1,
      'user': 2,
      'manager': 3,
      'admin': 4,
    };

    // This would need to be enhanced to get the actual role level
    // For now, return a default based on role name
    return 2; // Default to basic user level
  },

  // Check if user has sufficient role level
  hasRoleLevel: (user: User | null, requiredLevel: number): boolean => {
    return permissionUtils.getRoleLevel(user) >= requiredLevel;
  },

  // Cache management
  cacheUserPermissions: (userId: string, permissions: string[], role?: Role) => {
    permissionCache.setUserPermissions(userId, permissions, role);
  },

  invalidateUserCache: (userId: string) => {
    permissionCache.invalidateUser(userId);
  },

  clearCache: () => {
    permissionCache.clear();
  },
};

// Common permission constants
export const PERMISSIONS = {
  // Properties
  PROPERTIES: {
    CREATE: 'properties:create',
    READ: 'properties:read',
    UPDATE: 'properties:update',
    DELETE: 'properties:delete',
  },
  // Units
  UNITS: {
    CREATE: 'units:create',
    READ: 'units:read',
    UPDATE: 'units:update',
    DELETE: 'units:delete',
  },
  // Tenants
  TENANTS: {
    CREATE: 'tenants:create',
    READ: 'tenants:read',
    UPDATE: 'tenants:update',
    DELETE: 'tenants:delete',
  },
  // Leases
  LEASES: {
    CREATE: 'leases:create',
    READ: 'leases:read',
    UPDATE: 'leases:update',
    DELETE: 'leases:delete',
  },
  // Payments
  PAYMENTS: {
    CREATE: 'payments:create',
    READ: 'payments:read',
    UPDATE: 'payments:update',
    DELETE: 'payments:delete',
  },
  // Maintenance
  MAINTENANCE: {
    CREATE: 'maintenance:create',
    READ: 'maintenance:read',
    UPDATE: 'maintenance:update',
    DELETE: 'maintenance:delete',
  },
  // Documents
  DOCUMENTS: {
    CREATE: 'documents:create',
    READ: 'documents:read',
    UPDATE: 'documents:update',
    DELETE: 'documents:delete',
  },
  // Messages
  MESSAGES: {
    CREATE: 'messages:create',
    READ: 'messages:read',
    UPDATE: 'messages:update',
    DELETE: 'messages:delete',
  },
  // Notifications
  NOTIFICATIONS: {
    CREATE: 'notifications:create',
    READ: 'notifications:read',
    UPDATE: 'notifications:update',
    DELETE: 'notifications:delete',
  },
  // Users
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
  },
  // Roles
  ROLES: {
    CREATE: 'roles:create',
    READ: 'roles:read',
    UPDATE: 'roles:update',
    DELETE: 'roles:delete',
  },
  // Audit logs
  AUDIT: {
    READ: 'audit:read',
  },
} as const;

// Role level constants
export const ROLE_LEVELS = {
  TENANT: 1,
  USER: 2,
  MANAGER: 3,
  ADMIN: 4,
} as const;

export default permissionUtils;