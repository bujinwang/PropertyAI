import { dashboardService, AuditLog } from '../services/dashboardService';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API client for audit logging
const auditAPI = {
  createLog: async (data: {
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
    severity?: string;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/audit/log`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error calling audit API:', error);
      throw error;
    }
  },
};

// Audit logging utility
export const auditUtils = {
  // Log user-related actions
  logUserAction: async (
    userId: string,
    action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'password_reset' | 'status_change',
    resourceId: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    try {
      // Call the backend audit API
      await auditAPI.createLog({
        action: `USER_${action.toUpperCase()}`,
        entityType: 'USER',
        entityId: resourceId,
        details: {
          ...details,
          userId,
          ipAddress,
          userAgent: userAgent || navigator.userAgent,
        },
        severity: 'INFO',
      });
    } catch (error) {
      console.error('Failed to log user action:', error);
      // Don't throw - audit logging should not break the application
    }
  },

  // Log role-related actions
  logRoleAction: async (
    userId: string,
    action: 'create' | 'update' | 'delete' | 'permission_change',
    resourceId: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    try {
      const auditEntry: Omit<AuditLog, 'id' | 'createdAt'> = {
        userId,
        action,
        resource: 'roles',
        resourceId,
        details,
        ipAddress,
        userAgent,
      };

      // Call the backend audit API
      await auditAPI.createLog({
        action: `ROLE_${action.toUpperCase()}`,
        entityType: 'ROLE',
        entityId: resourceId,
        details: {
          ...details,
          userId,
          ipAddress,
          userAgent: userAgent || navigator.userAgent,
        },
        severity: 'INFO',
      });
    } catch (error) {
      console.error('Failed to log role action:', error);
    }
  },

  // Log permission-related actions
  logPermissionAction: async (
    userId: string,
    action: 'grant' | 'revoke' | 'bulk_update',
    resourceId: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    try {
      const auditEntry: Omit<AuditLog, 'id' | 'createdAt'> = {
        userId,
        action,
        resource: 'permissions',
        resourceId,
        details,
        ipAddress,
        userAgent,
      };

      // Call the backend audit API
      await auditAPI.createLog({
        action: `PERMISSION_${action.toUpperCase()}`,
        entityType: 'PERMISSION',
        entityId: resourceId,
        details: {
          ...details,
          userId,
          ipAddress,
          userAgent: userAgent || navigator.userAgent,
        },
        severity: 'WARNING',
      });
    } catch (error) {
      console.error('Failed to log permission action:', error);
    }
  },

  // Log invitation-related actions
  logInvitationAction: async (
    userId: string,
    action: 'send' | 'accept' | 'cancel' | 'resend' | 'expire',
    resourceId: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    try {
      const auditEntry: Omit<AuditLog, 'id' | 'createdAt'> = {
        userId,
        action,
        resource: 'invitations',
        resourceId,
        details,
        ipAddress,
        userAgent,
      };

      // Call the backend audit API
      await auditAPI.createLog({
        action: `INVITATION_${action.toUpperCase()}`,
        entityType: 'INVITATION',
        entityId: resourceId,
        details: {
          ...details,
          userId,
          ipAddress,
          userAgent: userAgent || navigator.userAgent,
        },
        severity: 'INFO',
      });
    } catch (error) {
      console.error('Failed to log invitation action:', error);
    }
  },

  // Helper to get client information
  getClientInfo: () => {
    return {
      ipAddress: undefined, // Would need to be provided by server or detected
      userAgent: navigator.userAgent,
    };
  },

  // Batch logging for bulk operations
  logBulkAction: async (
    userId: string,
    action: string,
    resource: string,
    resourceIds: string[],
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    try {
      const auditEntry: Omit<AuditLog, 'id' | 'createdAt'> = {
        userId,
        action: `bulk_${action}`,
        resource,
        resourceId: resourceIds.join(','),
        details: {
          ...details,
          affectedIds: resourceIds,
          count: resourceIds.length,
        },
        ipAddress,
        userAgent,
      };

      // Call the backend audit API
      await auditAPI.createLog({
        action: `BULK_${action.toUpperCase()}`,
        entityType: resource.toUpperCase(),
        entityId: resourceIds.join(','),
        details: {
          ...details,
          userId,
          affectedIds: resourceIds,
          count: resourceIds.length,
          ipAddress,
          userAgent: userAgent || navigator.userAgent,
        },
        severity: 'WARNING',
      });
    } catch (error) {
      console.error('Failed to log bulk action:', error);
    }
  },
};

// Higher-level audit functions for specific use cases
export const auditLogger = {
  // User management audits
  userCreated: (adminId: string, userId: string, userData: any) =>
    auditUtils.logUserAction(adminId, 'create', userId, { userData }),

  userUpdated: (adminId: string, userId: string, changes: any) =>
    auditUtils.logUserAction(adminId, 'update', userId, { changes }),

  userDeleted: (adminId: string, userId: string) =>
    auditUtils.logUserAction(adminId, 'delete', userId),

  userStatusChanged: (adminId: string, userId: string, oldStatus: string, newStatus: string) =>
    auditUtils.logUserAction(adminId, 'status_change', userId, { oldStatus, newStatus }),

  userLoggedIn: (userId: string, ipAddress?: string) =>
    auditUtils.logUserAction(userId, 'login', userId, {}, ipAddress),

  userLoggedOut: (userId: string) =>
    auditUtils.logUserAction(userId, 'logout', userId),

  passwordResetRequested: (userId: string, email: string) =>
    auditUtils.logUserAction(userId, 'password_reset', userId, { email }),

  // Role management audits
  roleCreated: (adminId: string, roleId: string, roleData: any) =>
    auditUtils.logRoleAction(adminId, 'create', roleId, { roleData }),

  roleUpdated: (adminId: string, roleId: string, changes: any) =>
    auditUtils.logRoleAction(adminId, 'update', roleId, { changes }),

  roleDeleted: (adminId: string, roleId: string) =>
    auditUtils.logRoleAction(adminId, 'delete', roleId),

  rolePermissionsChanged: (adminId: string, roleId: string, oldPermissions: string[], newPermissions: string[]) =>
    auditUtils.logRoleAction(adminId, 'permission_change', roleId, { oldPermissions, newPermissions }),

  // Invitation audits
  invitationSent: (adminId: string, invitationId: string, email: string, roleId: string) =>
    auditUtils.logInvitationAction(adminId, 'send', invitationId, { email, roleId }),

  invitationAccepted: (userId: string, invitationId: string) =>
    auditUtils.logInvitationAction(userId, 'accept', invitationId),

  invitationCancelled: (adminId: string, invitationId: string) =>
    auditUtils.logInvitationAction(adminId, 'cancel', invitationId),

  invitationResent: (adminId: string, invitationId: string) =>
    auditUtils.logInvitationAction(adminId, 'resend', invitationId),

  // Bulk operations
  bulkUsersUpdated: (adminId: string, userIds: string[], operation: string, details: any) =>
    auditUtils.logBulkAction(adminId, operation, 'users', userIds, details),

  bulkRolesUpdated: (adminId: string, roleIds: string[], operation: string, details: any) =>
    auditUtils.logBulkAction(adminId, operation, 'roles', roleIds, details),
};

export default auditLogger;