import { UserRole } from './auth';

/**
 * Defines all permission resources in the system
 * Resources are high-level entities or features
 */
export enum Resource {
  DASHBOARD = 'dashboard',
  PROPERTIES = 'properties',
  UNITS = 'units',
  LISTINGS = 'listings',
  TENANTS = 'tenants',
  APPLICATIONS = 'applications',
  MAINTENANCE = 'maintenance',
  DOCUMENTS = 'documents',
  MESSAGES = 'messages',
  PAYMENTS = 'payments',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  USERS = 'users',
  AI_FEATURES = 'ai_features',
}

/**
 * Defines all possible actions that can be performed on resources
 */
export enum Action {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  COMMENT = 'comment',
  EXPORT = 'export',
  IMPORT = 'import',
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  GENERATE = 'generate',
}

/**
 * Permission type that combines a resource and an action
 */
export type Permission = `${Resource}.${Action}`;

/**
 * Specific permissions that combine a resource and action
 * These are concrete permissions that can be granted to roles
 */
export const Permissions = {
  // Dashboard permissions
  DASHBOARD_VIEW: `${Resource.DASHBOARD}.${Action.VIEW}` as Permission,
  
  // Property permissions
  PROPERTIES_VIEW: `${Resource.PROPERTIES}.${Action.VIEW}` as Permission,
  PROPERTIES_CREATE: `${Resource.PROPERTIES}.${Action.CREATE}` as Permission,
  PROPERTIES_EDIT: `${Resource.PROPERTIES}.${Action.EDIT}` as Permission,
  PROPERTIES_DELETE: `${Resource.PROPERTIES}.${Action.DELETE}` as Permission,
  
  // Unit permissions
  UNITS_VIEW: `${Resource.UNITS}.${Action.VIEW}` as Permission,
  UNITS_CREATE: `${Resource.UNITS}.${Action.CREATE}` as Permission,
  UNITS_EDIT: `${Resource.UNITS}.${Action.EDIT}` as Permission,
  UNITS_DELETE: `${Resource.UNITS}.${Action.DELETE}` as Permission,
  
  // Listing permissions
  LISTINGS_VIEW: `${Resource.LISTINGS}.${Action.VIEW}` as Permission,
  LISTINGS_CREATE: `${Resource.LISTINGS}.${Action.CREATE}` as Permission,
  LISTINGS_EDIT: `${Resource.LISTINGS}.${Action.EDIT}` as Permission,
  LISTINGS_DELETE: `${Resource.LISTINGS}.${Action.DELETE}` as Permission,
  LISTINGS_PUBLISH: `${Resource.LISTINGS}.${Action.PUBLISH}` as Permission,
  LISTINGS_UNPUBLISH: `${Resource.LISTINGS}.${Action.UNPUBLISH}` as Permission,
  
  // Tenant permissions
  TENANTS_VIEW: `${Resource.TENANTS}.${Action.VIEW}` as Permission,
  TENANTS_CREATE: `${Resource.TENANTS}.${Action.CREATE}` as Permission,
  TENANTS_EDIT: `${Resource.TENANTS}.${Action.EDIT}` as Permission,
  TENANTS_DELETE: `${Resource.TENANTS}.${Action.DELETE}` as Permission,
  
  // Application permissions
  APPLICATIONS_VIEW: `${Resource.APPLICATIONS}.${Action.VIEW}` as Permission,
  APPLICATIONS_CREATE: `${Resource.APPLICATIONS}.${Action.CREATE}` as Permission,
  APPLICATIONS_APPROVE: `${Resource.APPLICATIONS}.${Action.APPROVE}` as Permission,
  APPLICATIONS_REJECT: `${Resource.APPLICATIONS}.${Action.REJECT}` as Permission,
  
  // Maintenance permissions
  MAINTENANCE_VIEW: `${Resource.MAINTENANCE}.${Action.VIEW}` as Permission,
  MAINTENANCE_CREATE: `${Resource.MAINTENANCE}.${Action.CREATE}` as Permission,
  MAINTENANCE_EDIT: `${Resource.MAINTENANCE}.${Action.EDIT}` as Permission,
  MAINTENANCE_ASSIGN: `${Resource.MAINTENANCE}.${Action.ASSIGN}` as Permission,
  MAINTENANCE_COMMENT: `${Resource.MAINTENANCE}.${Action.COMMENT}` as Permission,
  
  // Document permissions
  DOCUMENTS_VIEW: `${Resource.DOCUMENTS}.${Action.VIEW}` as Permission,
  DOCUMENTS_UPLOAD: `${Resource.DOCUMENTS}.${Action.UPLOAD}` as Permission,
  DOCUMENTS_DOWNLOAD: `${Resource.DOCUMENTS}.${Action.DOWNLOAD}` as Permission,
  DOCUMENTS_DELETE: `${Resource.DOCUMENTS}.${Action.DELETE}` as Permission,
  
  // Message permissions
  MESSAGES_VIEW: `${Resource.MESSAGES}.${Action.VIEW}` as Permission,
  MESSAGES_CREATE: `${Resource.MESSAGES}.${Action.CREATE}` as Permission,
  
  // Payment permissions
  PAYMENTS_VIEW: `${Resource.PAYMENTS}.${Action.VIEW}` as Permission,
  PAYMENTS_CREATE: `${Resource.PAYMENTS}.${Action.CREATE}` as Permission,
  PAYMENTS_EXPORT: `${Resource.PAYMENTS}.${Action.EXPORT}` as Permission,
  
  // Report permissions
  REPORTS_VIEW: `${Resource.REPORTS}.${Action.VIEW}` as Permission,
  REPORTS_GENERATE: `${Resource.REPORTS}.${Action.GENERATE}` as Permission,
  REPORTS_EXPORT: `${Resource.REPORTS}.${Action.EXPORT}` as Permission,
  
  // Settings permissions
  SETTINGS_VIEW: `${Resource.SETTINGS}.${Action.VIEW}` as Permission,
  SETTINGS_EDIT: `${Resource.SETTINGS}.${Action.EDIT}` as Permission,
  
  // User permissions
  USERS_VIEW: `${Resource.USERS}.${Action.VIEW}` as Permission,
  USERS_CREATE: `${Resource.USERS}.${Action.CREATE}` as Permission,
  USERS_EDIT: `${Resource.USERS}.${Action.EDIT}` as Permission,
  USERS_DELETE: `${Resource.USERS}.${Action.DELETE}` as Permission,
  
  // AI Features permissions
  AI_FEATURES_VIEW: `${Resource.AI_FEATURES}.${Action.VIEW}` as Permission,
  AI_FEATURES_CREATE: `${Resource.AI_FEATURES}.${Action.CREATE}` as Permission,
  AI_FEATURES_EDIT: `${Resource.AI_FEATURES}.${Action.EDIT}` as Permission,
  AI_FEATURES_GENERATE: `${Resource.AI_FEATURES}.${Action.GENERATE}` as Permission,
};

/**
 * Role hierarchy used to determine access levels
 * Higher index means higher access level
 */
export const ROLE_HIERARCHY: UserRole[] = [
  'tenant',
  'propertyManager',
  'admin',
];

/**
 * Type for defining role-based permission sets
 */
export type RolePermissions = {
  [key in UserRole]: Permission[];
};

// Define tenant permissions first
const TENANT_PERMISSIONS: Permission[] = [
  Permissions.DASHBOARD_VIEW,
  Permissions.PROPERTIES_VIEW,
  Permissions.UNITS_VIEW,
  Permissions.LISTINGS_VIEW,
  Permissions.MAINTENANCE_VIEW,
  Permissions.MAINTENANCE_CREATE,
  Permissions.MAINTENANCE_COMMENT,
  Permissions.DOCUMENTS_VIEW,
  Permissions.DOCUMENTS_UPLOAD,
  Permissions.DOCUMENTS_DOWNLOAD,
  Permissions.MESSAGES_VIEW,
  Permissions.MESSAGES_CREATE,
  Permissions.PAYMENTS_VIEW,
  Permissions.PAYMENTS_CREATE,
  Permissions.SETTINGS_VIEW,
  Permissions.AI_FEATURES_VIEW,
  Permissions.AI_FEATURES_GENERATE,
];

// Define property manager specific permissions
const PROPERTY_MANAGER_PERMISSIONS: Permission[] = [
  Permissions.PROPERTIES_CREATE,
  Permissions.PROPERTIES_EDIT,
  Permissions.UNITS_CREATE,
  Permissions.UNITS_EDIT,
  Permissions.LISTINGS_CREATE,
  Permissions.LISTINGS_EDIT,
  Permissions.LISTINGS_PUBLISH,
  Permissions.LISTINGS_UNPUBLISH,
  Permissions.TENANTS_VIEW,
  Permissions.TENANTS_CREATE,
  Permissions.TENANTS_EDIT,
  Permissions.APPLICATIONS_VIEW,
  Permissions.APPLICATIONS_APPROVE,
  Permissions.APPLICATIONS_REJECT,
  Permissions.MAINTENANCE_EDIT,
  Permissions.MAINTENANCE_ASSIGN,
  Permissions.REPORTS_VIEW,
  Permissions.REPORTS_GENERATE,
  Permissions.REPORTS_EXPORT,
  Permissions.SETTINGS_EDIT,
  Permissions.AI_FEATURES_CREATE,
  Permissions.AI_FEATURES_EDIT,
];

// Define admin specific permissions
const ADMIN_PERMISSIONS: Permission[] = [
  Permissions.PROPERTIES_DELETE,
  Permissions.UNITS_DELETE,
  Permissions.LISTINGS_DELETE,
  Permissions.TENANTS_DELETE,
  Permissions.DOCUMENTS_DELETE,
  Permissions.USERS_VIEW,
  Permissions.USERS_CREATE,
  Permissions.USERS_EDIT,
  Permissions.USERS_DELETE,
];

/**
 * Specific permissions assigned to each role
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  tenant: TENANT_PERMISSIONS,
  
  propertyManager: [
    // All tenant permissions
    ...TENANT_PERMISSIONS,
    // Additional property manager permissions
    ...PROPERTY_MANAGER_PERMISSIONS,
  ],
  
  admin: [
    // All tenant permissions
    ...TENANT_PERMISSIONS,
    // All property manager permissions
    ...PROPERTY_MANAGER_PERMISSIONS,
    // Additional admin permissions
    ...ADMIN_PERMISSIONS,
  ],
};

/**
 * Get context-specific permission checks (e.g., for owned resources)
 * This is used to further restrict permissions based on ownership
 */
export const CONTEXT_PERMISSIONS = {
  // View only their own properties (for tenants)
  OWN_PROPERTY: (userId: string, resourceOwnerId: string): boolean => {
    return userId === resourceOwnerId;
  },
  
  // View only their own payments (for tenants)
  OWN_PAYMENT: (userId: string, paymentUserId: string): boolean => {
    return userId === paymentUserId;
  },
};

/**
 * Permission scopes for resources
 * Defines the scope of access for different permissions
 */
export enum PermissionScope {
  ALL = 'all',      // Access to all resources
  OWNED = 'owned',  // Access only to owned resources
  ASSIGNED = 'assigned', // Access only to assigned resources
  NONE = 'none',    // No access
}

/**
 * Permission scope configuration by role and resource
 */
export const PERMISSION_SCOPES: Record<UserRole, Partial<Record<Resource, PermissionScope>>> = {
  tenant: {
    [Resource.PROPERTIES]: PermissionScope.OWNED,
    [Resource.UNITS]: PermissionScope.OWNED,
    [Resource.MAINTENANCE]: PermissionScope.OWNED,
    [Resource.PAYMENTS]: PermissionScope.OWNED,
    [Resource.DOCUMENTS]: PermissionScope.OWNED,
  },
  
  propertyManager: {
    [Resource.PROPERTIES]: PermissionScope.ASSIGNED,
    [Resource.UNITS]: PermissionScope.ASSIGNED,
    [Resource.TENANTS]: PermissionScope.ASSIGNED,
    [Resource.MAINTENANCE]: PermissionScope.ASSIGNED,
  },
  
  admin: {
    [Resource.PROPERTIES]: PermissionScope.ALL,
    [Resource.UNITS]: PermissionScope.ALL,
    [Resource.TENANTS]: PermissionScope.ALL,
    [Resource.MAINTENANCE]: PermissionScope.ALL,
    [Resource.USERS]: PermissionScope.ALL,
  },
}; 