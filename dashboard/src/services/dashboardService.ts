import api from './api';

// Interfaces for dashboard data (inferred from standard property models)
export interface VacantUnit {
  id: string;
  propertyId: string;
  unitNumber: string;
  address: string;
  city: string;
  state: string;
  size: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  availableDate: string;
  description?: string;
}

export interface Assignment {
  id: string;
  tenantId: string;
  unitId: string;
  leaseStart: string;
  leaseEnd?: string;
  status: 'active' | 'terminated';
  createdAt: string;
  updatedAt: string;
}

export interface UnitOption {
  id: string;
  unitNumber: string;
  address: string;
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  unitId: string;
  propertyId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'closed' | 'cancelled';
  submittedAt: string;
  updatedAt: string;
  // Populated fields for display
  tenantName?: string;
  unitAddress?: string;
}

export interface WorkOrder {
  id: string;
  requestId: string;
  assignedStaff: string;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  status: 'pending' | 'in progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  requestDescription?: string;
  tenantName?: string;
  unitNumber?: string;
}

export interface OverduePayment {
  id: string;
  tenantId: string;
  tenantName: string;
  unitNumber: string;
  propertyId: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  paymentMethod: string;
}

export interface OverduePaymentsFilters {
  propertyId?: string;
  tenantId?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  minDaysOverdue?: number;
  maxDaysOverdue?: number;
}

export interface FinancialReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'annual';
  period: string;
  totalRevenue: number;
  totalOverdue: number;
  paymentTrends: {
    date: string;
    amount: number;
    status: 'paid' | 'overdue' | 'pending';
  }[];
  propertyBreakdown: {
    propertyId: string;
    propertyName: string;
    revenue: number;
    overdue: number;
  }[];
}

export interface FinancialReportsParams {
  type?: 'monthly' | 'quarterly' | 'annual';
  period?: string;
  propertyId?: string;
}

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'overdue' | 'pending';
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  leaseId: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card';
  paymentDate: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  tenantName?: string;
  leaseDetails?: string;
}

export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  status: string;
  totalUnits: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  type: string;
  occupancyStatus: 'occupied' | 'vacant' | 'maintenance';
  rentAmount: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  leaseStart: string;
  leaseEnd?: string;
  status: 'active' | 'pending' | 'evicted';
  createdAt: string;
  updatedAt: string;
  unitId?: string;
}

export interface Lease {
  id: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'annually';
  status: 'active' | 'expired' | 'renewed';
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  tenantName?: string;
  unitAddress?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  createdByName?: string;
  documentCount?: number;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  propertyId?: string;
  tenantId?: string;
  leaseId?: string;
  maintenanceId?: string;
  folderId?: string;
  tags: string[];
  sharedWith: string[]; // Array of user IDs
  version: number;
  permissions: 'private' | 'shared' | 'public';
  uploadedAt: string;
  updatedAt: string;
  // Populated fields for display
  uploadedByName?: string;
  propertyName?: string;
  tenantName?: string;
  leaseDetails?: string;
  maintenanceTitle?: string;
  folderName?: string;
  sharedWithNames?: string[];
}

export interface DocumentFilters {
  search?: string;
  type?: string;
  entityId?: string;
  propertyId?: string;
  tenantId?: string;
  leaseId?: string;
  maintenanceId?: string;
  tags?: string[];
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  folderId?: string;
  permissions?: 'private' | 'shared' | 'public';
  sharedWith?: string;
}

export interface DocumentUploadData {
  file: File;
  name: string;
  description?: string;
  propertyId?: string;
  tenantId?: string;
  leaseId?: string;
  maintenanceId?: string;
  tags?: string[];
}

// Message-related interfaces
export interface Message {
  id: string;
  senderId: string;
  recipientIds: string[];
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  updatedAt: string;
  threadId: string;
  attachments?: MessageAttachment[];
  // Populated fields for display
  senderName?: string;
  recipientNames?: string[];
  hasAttachments?: boolean;
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: string[];
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  participantNames?: string[];
  lastMessageSender?: string;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

export interface MessageFilters {
  search?: string;
  isRead?: boolean;
  senderId?: string;
  recipientId?: string;
  dateFrom?: string;
  dateTo?: string;
  threadId?: string;
}

// Notification-related interfaces
export interface Notification {
  id: string;
  type: 'announcement' | 'maintenance' | 'payment' | 'lease' | 'system';
  title: string;
  message: string;
  recipientIds: string[];
  senderId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  senderName?: string;
  recipientNames?: string[];
  deliveryCount?: number;
  readCount?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  recipientGroups: string[]; // e.g., 'all-tenants', 'property-specific', 'unit-specific'
  propertyIds?: string[];
  tenantIds?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  recipientCount?: number;
  readCount?: number;
  createdByName?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'announcement' | 'maintenance' | 'payment' | 'lease' | 'system';
  subject: string;
  content: string;
  variables: string[]; // e.g., ['tenantName', 'propertyAddress', 'dueDate']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields for display
  usageCount?: number;
  createdByName?: string;
}

export interface NotificationFilters {
  search?: string;
  type?: string;
  status?: string;
  priority?: string;
  senderId?: string;
  recipientId?: string;
  dateFrom?: string;
  dateTo?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  recipientGroups: string[];
  propertyIds?: string[];
  tenantIds?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt?: string;
  expiresAt?: string;
}

export interface CreateNotificationTemplateData {
  name: string;
  type: 'announcement' | 'maintenance' | 'payment' | 'lease' | 'system';
  subject: string;
  content: string;
  variables: string[];
}

export interface ScheduleNotificationData {
  templateId?: string;
  title: string;
  message: string;
  recipientIds: string[];
  scheduledAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SendMessageData {
  recipientIds: string[];
  subject: string;
  content: string;
  attachments?: File[];
  threadId?: string;
}

export interface MessageUploadData {
  file: File;
  messageId?: string;
}

// User Management interfaces
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number; // 1=Admin, 2=Manager, 3=Staff, 4=Tenant
  customPermissions: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string; // e.g., 'properties', 'users'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastLogin?: string;
  profileImage?: string;
  phone?: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      inApp: boolean;
      sms: boolean;
    };
    language: string;
  };
  createdAt: string;
  updatedAt: string;
  // Populated fields
  roleName?: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  roleId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  invitedByName?: string;
  roleName?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  // Populated fields
  userName?: string;
}

export interface UserFilters {
  search?: string;
  roleId?: string;
  status?: string;
  lastLoginFrom?: string;
  lastLoginTo?: string;
}

export interface RoleFilters {
  search?: string;
  level?: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  roleId: string;
  phone?: string;
  preferences?: Partial<User['preferences']>;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roleId?: string;
  status?: User['status'];
  phone?: string;
  preferences?: Partial<User['preferences']>;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
  customPermissions?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  customPermissions?: boolean;
}

export interface InviteUserData {
  email: string;
  roleId: string;
  message?: string;
}

export interface BulkUserOperation {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'suspend' | 'delete' | 'change_role';
  roleId?: string; // for change_role operation
}

export interface BulkRoleOperation {
  roleIds: string[];
  operation: 'delete' | 'update_permissions';
  permissions?: string[]; // for update_permissions
}

// API Service functions
export const dashboardService = {
  // Fetch vacant units summary (top 5 or all)
  getVacantUnits: async (): Promise<VacantUnit[]> => {
    const response = await api.get<VacantUnit[]>('/units/vacant?limit=5');
    return response.data;
  },


  // Fetch overdue payments alerts (limit 5)
  getOverduePayments: async (filters?: OverduePaymentsFilters): Promise<OverduePayment[]> => {
    const params = new URLSearchParams();
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.tenantId) params.append('tenantId', filters.tenantId);
    if (filters?.dateFrom) params.append('dateFrom', typeof filters.dateFrom === 'string' ? filters.dateFrom : filters.dateFrom.toISOString().split('T')[0]);
    if (filters?.dateTo) params.append('dateTo', typeof filters.dateTo === 'string' ? filters.dateTo : filters.dateTo.toISOString().split('T')[0]);
    if (filters?.minDaysOverdue) params.append('minDaysOverdue', filters.minDaysOverdue.toString());
    if (filters?.maxDaysOverdue) params.append('maxDaysOverdue', filters.maxDaysOverdue.toString());
    params.append('limit', '100'); // Higher limit for the list page
    params.append('sort', 'daysOverdue:desc');

    const queryString = params.toString();
    const url = `/payments/overdue${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<OverduePayment[]>(url);
    return response.data;
  },

  // Fetch financial reports
  getFinancialReports: async (params?: FinancialReportsParams): Promise<FinancialReport[]> => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.propertyId) queryParams.append('propertyId', params.propertyId);

    const queryString = queryParams.toString();
    const url = `/financial-reports${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<FinancialReport[]>(url);
    return response.data;
  },

  // Export reports
  exportReport: async (format: 'csv' | 'pdf', type: string, params?: FinancialReportsParams): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    queryParams.append('type', type);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.propertyId) queryParams.append('propertyId', params.propertyId);

    const response = await api.get(`/export-reports?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  // Property/Rental CRUD operations
  getProperties: async (page: number = 1, limit: number = 10, search?: string): Promise<{data: Property[], total: number, page: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    const response = await api.get<{data: Property[], total: number, page: number}>(`/properties?${params.toString()}`);
    return response.data;
  },

  getProperty: async (id: string): Promise<Property> => {
    const response = await api.get<Property>(`/properties/${id}`);
    return response.data;
  },

  createProperty: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    const response = await api.post<Property>('/properties', property);
    return response.data;
  },

  updateProperty: async (id: string, property: Partial<Omit<Property, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Property> => {
    const response = await api.put<Property>(`/properties/${id}`, property);
    return response.data;
  },

  deleteProperty: async (id: string): Promise<void> => {
    await api.delete(`/properties/${id}`);
  },

  getUnitsByProperty: async (propertyId: string): Promise<Unit[]> => {
    const response = await api.get<Unit[]>(`/properties/${propertyId}/units`);
    return response.data;
  },

  createUnit: async (propertyId: string, unit: Omit<Unit, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>): Promise<Unit> => {
    const response = await api.post<Unit>(`/properties/${propertyId}/units`, unit);
    return response.data;
  },

  updateUnit: async (unitId: string, unit: Partial<Omit<Unit, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>>): Promise<Unit> => {
    const response = await api.put<Unit>(`/units/${unitId}`, unit);
    return response.data;
  },

  deleteUnit: async (unitId: string): Promise<void> => {
    await api.delete(`/units/${unitId}`);
  },

  // Tenant CRUD operations
  getTenants: async (page: number = 1, limit: number = 10, search?: string): Promise<{data: Tenant[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    const response = await api.get<{data: Tenant[], total: number}>(`/tenants?${params.toString()}`);
    return response.data;
  },

  createTenant: async (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> => {
    const response = await api.post<Tenant>('/tenants', tenant);
    return response.data;
  },

  updateTenant: async (id: string, tenant: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant> => {
    const response = await api.put<Tenant>(`/tenants/${id}`, tenant);
    return response.data;
  },

  deleteTenant: async (id: string): Promise<void> => {
    await api.delete(`/tenants/${id}`);
  },

  // Assignment operations
  getVacantUnitOptions: async (propertyId?: string): Promise<UnitOption[]> => {
    const params = propertyId ? `?propertyId=${propertyId}` : '';
    const response = await api.get<UnitOption[]>(`/units/vacant/options${params}`);
    return response.data;
  },

  assignTenantToUnit: async (tenantId: string, unitId: string, leaseStart: Date, leaseEnd?: Date): Promise<Assignment> => {
    const response = await api.post<Assignment>('/assignments', {
      tenantId,
      unitId,
      leaseStart: leaseStart.toISOString(),
      leaseEnd: leaseEnd?.toISOString(),
    });
    return response.data;
  },

  unassignTenant: async (assignmentId: string): Promise<void> => {
    await api.delete(`/assignments/${assignmentId}`);
  },

  bulkAssign: async (tenantIds: string[], unitIds: string[], leaseStart: Date, leaseEnd?: Date): Promise<Assignment[]> => {
    const response = await api.post<Assignment[]>('/assignments/bulk', {
      tenantIds,
      unitIds,
      leaseStart: leaseStart.toISOString(),
      leaseEnd: leaseEnd?.toISOString(),
    });
    return response.data;
  },

  getAssignments: async (propertyId?: string): Promise<Assignment[]> => {
    const params = propertyId ? `?propertyId=${propertyId}` : '';
    const response = await api.get<Assignment[]>(`/assignments${params}`);
    return response.data;
  },

  // Lease CRUD operations
  getLeases: async (page: number = 1, limit: number = 10, search?: string): Promise<{data: Lease[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    const response = await api.get<{data: Lease[], total: number}>(`/leases?${params.toString()}`);
    return response.data;
  },

  createLease: async (lease: Omit<Lease, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lease> => {
    const response = await api.post<Lease>('/leases', lease);
    return response.data;
  },

  updateLease: async (id: string, lease: Partial<Omit<Lease, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Lease> => {
    const response = await api.put<Lease>(`/leases/${id}`, lease);
    return response.data;
  },

  deleteLease: async (id: string): Promise<void> => {
    await api.delete(`/leases/${id}`);
  },

  // Lease association and renewal operations
  associateLeaseToTenantUnit: async (leaseId: string, tenantId: string, unitId: string): Promise<Lease> => {
    const response = await api.post<Lease>(`/leases/${leaseId}/associate`, { tenantId, unitId });
    return response.data;
  },

  renewLease: async (leaseId: string, newEndDate: string): Promise<Lease> => {
    const response = await api.patch<Lease>(`/leases/${leaseId}/renew`, { endDate: newEndDate });
    return response.data;
  },

  // Payment operations
  getPayments: async (leaseId: string): Promise<Payment[]> => {
    const response = await api.get<Payment[]>(`/leases/${leaseId}/payments`);
    return response.data;
  },

  markPaymentPaid: async (paymentId: string, paidDate?: string): Promise<Payment> => {
    const response = await api.patch<Payment>(`/payments/${paymentId}`, {
      status: 'paid',
      paidDate: paidDate || new Date().toISOString().split('T')[0]
    });
    return response.data;
  },

  // Enhanced tenant operations for available tenants
  getAvailableTenants: async (propertyId?: string): Promise<Tenant[]> => {
    const params = propertyId ? `?available=true&propertyId=${propertyId}` : '?available=true';
    const response = await api.get<Tenant[]>(`/tenants${params}`);
    return response.data;
  },

  // Maintenance Request CRUD operations
  getMaintenanceRequests: async (page: number = 1, limit: number = 10, search?: string, status?: string, priority?: string): Promise<{data: MaintenanceRequest[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    if (status) {
      params.append('status', status);
    }
    if (priority) {
      params.append('priority', priority);
    }
    const response = await api.get<{data: MaintenanceRequest[], total: number}>(`/maintenance-requests?${params.toString()}`);
    return response.data;
  },

  createMaintenanceRequest: async (maintenanceRequest: Omit<MaintenanceRequest, 'id' | 'submittedAt' | 'updatedAt'>): Promise<MaintenanceRequest> => {
    const response = await api.post<MaintenanceRequest>('/maintenance-requests', maintenanceRequest);
    return response.data;
  },

  updateMaintenanceRequest: async (id: string, maintenanceRequest: Partial<Omit<MaintenanceRequest, 'id' | 'submittedAt' | 'updatedAt'>>): Promise<MaintenanceRequest> => {
    const response = await api.put<MaintenanceRequest>(`/maintenance-requests/${id}`, maintenanceRequest);
    return response.data;
  },

  deleteMaintenanceRequest: async (id: string): Promise<void> => {
    await api.delete(`/maintenance-requests/${id}`);
  },

  // Work Order CRUD operations
  getWorkOrders: async (page: number = 1, limit: number = 10, search?: string): Promise<{data: WorkOrder[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    const response = await api.get<{data: WorkOrder[], total: number}>(`/work-orders?${params.toString()}`);
    return response.data;
  },

  createWorkOrder: async (workOrder: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder> => {
    const response = await api.post<WorkOrder>('/work-orders', workOrder);
    return response.data;
  },

  updateWorkOrder: async (id: string, workOrder: Partial<Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>>): Promise<WorkOrder> => {
    const response = await api.put<WorkOrder>(`/work-orders/${id}`, workOrder);
    return response.data;
  },

  deleteWorkOrder: async (id: string): Promise<void> => {
    await api.delete(`/work-orders/${id}`);
  },

  // Payment Record CRUD operations
  getPaymentRecords: async (page: number = 1, limit: number = 10, search?: string, status?: string, method?: string, dateFrom?: string, dateTo?: string): Promise<{data: PaymentRecord[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    if (status) {
      params.append('status', status);
    }
    if (method) {
      params.append('method', method);
    }
    if (dateFrom) {
      params.append('dateFrom', dateFrom);
    }
    if (dateTo) {
      params.append('dateTo', dateTo);
    }
    const response = await api.get<{data: PaymentRecord[], total: number}>(`/payments?${params.toString()}`);
    return response.data;
  },

  createPaymentRecord: async (payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentRecord> => {
    const response = await api.post<PaymentRecord>('/payments', payment);
    return response.data;
  },

  updatePaymentRecord: async (id: string, payment: Partial<Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PaymentRecord> => {
    const response = await api.put<PaymentRecord>(`/payments/${id}`, payment);
    return response.data;
  },

  deletePaymentRecord: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },

  // Document CRUD operations
  getDocuments: async (page: number = 1, limit: number = 10, filters?: DocumentFilters): Promise<{data: Document[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.entityId) {
      params.append('entityId', filters.entityId);
    }
    if (filters?.propertyId) {
      params.append('propertyId', filters.propertyId);
    }
    if (filters?.tenantId) {
      params.append('tenantId', filters.tenantId);
    }
    if (filters?.leaseId) {
      params.append('leaseId', filters.leaseId);
    }
    if (filters?.maintenanceId) {
      params.append('maintenanceId', filters.maintenanceId);
    }
    if (filters?.uploadedBy) {
      params.append('uploadedBy', filters.uploadedBy);
    }
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
    if (filters?.tags && filters.tags.length > 0) {
      params.append('tags', filters.tags.join(','));
    }
    if (filters?.folderId) {
      params.append('folderId', filters.folderId);
    }
    if (filters?.permissions) {
      params.append('permissions', filters.permissions);
    }
    if (filters?.sharedWith) {
      params.append('sharedWith', filters.sharedWith);
    }
    const response = await api.get<{data: Document[], total: number}>(`/documents?${params.toString()}`);
    return response.data;
  },

  uploadDocument: async (data: DocumentUploadData): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.propertyId) {
      formData.append('propertyId', data.propertyId);
    }
    if (data.tenantId) {
      formData.append('tenantId', data.tenantId);
    }
    if (data.leaseId) {
      formData.append('leaseId', data.leaseId);
    }
    if (data.maintenanceId) {
      formData.append('maintenanceId', data.maintenanceId);
    }
    if (data.tags && data.tags.length > 0) {
      formData.append('tags', JSON.stringify(data.tags));
    }

    const response = await api.post<Document>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateDocument: async (id: string, data: Partial<Pick<Document, 'name' | 'description' | 'tags'>>): Promise<Document> => {
    const response = await api.put<Document>(`/documents/${id}`, data);
    return response.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  downloadDocument: async (id: string): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  // Folder operations
  createFolder: async (data: { name: string; parentId?: string }): Promise<Folder> => {
    const response = await api.post<Folder>('/folders', data);
    return response.data;
  },

  getFolders: async (): Promise<Folder[]> => {
    const response = await api.get<Folder[]>('/folders');
    return response.data;
  },

  updateFolder: async (id: string, data: Partial<Pick<Folder, 'name' | 'parentId'>>): Promise<Folder> => {
    const response = await api.put<Folder>(`/folders/${id}`, data);
    return response.data;
  },

  deleteFolder: async (id: string): Promise<void> => {
    await api.delete(`/folders/${id}`);
  },

  // Enhanced document operations
  moveDocument: async (id: string, folderId: string | null): Promise<Document> => {
    const response = await api.put<Document>(`/documents/${id}/move`, { folderId });
    return response.data;
  },

  addTags: async (id: string, tags: string[]): Promise<Document> => {
    const response = await api.put<Document>(`/documents/${id}/tags`, { tags });
    return response.data;
  },

  searchDocuments: async (query: string, filters?: Partial<DocumentFilters>): Promise<{data: Document[], total: number}> => {
    const params = new URLSearchParams({ q: query });
    if (filters?.tags && filters.tags.length > 0) {
      params.append('tags', filters.tags.join(','));
    }
    if (filters?.folderId) params.append('folderId', filters.folderId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.uploadedBy) params.append('uploadedBy', filters.uploadedBy);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.permissions) params.append('permissions', filters.permissions);
    if (filters?.sharedWith) params.append('sharedWith', filters.sharedWith);

    const response = await api.get<{data: Document[], total: number}>(`/documents/search?${params.toString()}`);
    return response.data;
  },

  shareDocument: async (id: string, userIds: string[]): Promise<Document> => {
    const response = await api.post<Document>(`/documents/${id}/share`, { userIds });
    return response.data;
  },

  getDocumentVersions: async (id: string): Promise<Document[]> => {
    const response = await api.get<Document[]>(`/documents/${id}/versions`);
    return response.data;
  },

  // Bulk operations
  bulkMoveDocuments: async (documentIds: string[], folderId: string | null): Promise<Document[]> => {
    const response = await api.put<Document[]>('/documents/bulk/move', { documentIds, folderId });
    return response.data;
  },

  bulkTagDocuments: async (documentIds: string[], tags: string[]): Promise<Document[]> => {
    const response = await api.put<Document[]>('/documents/bulk/tags', { documentIds, tags });
    return response.data;
  },

  bulkDeleteDocuments: async (documentIds: string[]): Promise<void> => {
    const params = new URLSearchParams();
    params.append('ids', documentIds.join(','));
    await api.delete(`/documents/bulk?${params.toString()}`);
  },

  // Message CRUD operations
  getMessages: async (page: number = 1, limit: number = 10, filters?: MessageFilters): Promise<{data: Message[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.isRead !== undefined) {
      params.append('isRead', filters.isRead.toString());
    }
    if (filters?.senderId) {
      params.append('senderId', filters.senderId);
    }
    if (filters?.recipientId) {
      params.append('recipientId', filters.recipientId);
    }
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
    if (filters?.threadId) {
      params.append('threadId', filters.threadId);
    }
    const response = await api.get<{data: Message[], total: number}>(`/messages?${params.toString()}`);
    return response.data;
  },

  getMessage: async (id: string): Promise<Message> => {
    const response = await api.get<Message>(`/messages/${id}`);
    return response.data;
  },

  sendMessage: async (data: SendMessageData): Promise<Message> => {
    const formData = new FormData();
    formData.append('recipientIds', JSON.stringify(data.recipientIds));
    formData.append('subject', data.subject);
    formData.append('content', data.content);
    if (data.threadId) {
      formData.append('threadId', data.threadId);
    }
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await api.post<Message>('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  markMessageAsRead: async (id: string): Promise<Message> => {
    const response = await api.patch<Message>(`/messages/${id}/read`, {});
    return response.data;
  },

  deleteMessage: async (id: string): Promise<void> => {
    await api.delete(`/messages/${id}`);
  },

  // Message Thread operations
  getMessageThreads: async (page: number = 1, limit: number = 10, search?: string): Promise<{data: MessageThread[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    const response = await api.get<{data: MessageThread[], total: number}>(`/message-threads?${params.toString()}`);
    return response.data;
  },

  getMessageThread: async (id: string): Promise<{thread: MessageThread, messages: Message[]}> => {
    const response = await api.get<{thread: MessageThread, messages: Message[]}>(`/message-threads/${id}`);
    return response.data;
  },

  deleteMessageThread: async (id: string): Promise<void> => {
    await api.delete(`/message-threads/${id}`);
  },

  // Message Attachment operations
  uploadMessageAttachment: async (data: MessageUploadData): Promise<MessageAttachment> => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.messageId) {
      formData.append('messageId', data.messageId);
    }

    const response = await api.post<MessageAttachment>('/message-attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadMessageAttachment: async (id: string): Promise<Blob> => {
    const response = await api.get(`/message-attachments/${id}/download`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  deleteMessageAttachment: async (id: string): Promise<void> => {
    await api.delete(`/message-attachments/${id}`);
  },

  // Search messages
  searchMessages: async (query: string, filters?: Partial<MessageFilters>): Promise<{data: Message[], total: number}> => {
    const params = new URLSearchParams({ q: query });
    if (filters?.threadId) params.append('threadId', filters.threadId);
    if (filters?.senderId) params.append('senderId', filters.senderId);
    if (filters?.recipientId) params.append('recipientId', filters.recipientId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());

    const response = await api.get<{data: Message[], total: number}>(`/messages/search?${params.toString()}`);
    return response.data;
  },

  // Notification CRUD operations
  getNotifications: async (page: number = 1, limit: number = 10, filters?: NotificationFilters): Promise<{data: Notification[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.priority) {
      params.append('priority', filters.priority);
    }
    if (filters?.senderId) {
      params.append('senderId', filters.senderId);
    }
    if (filters?.recipientId) {
      params.append('recipientId', filters.recipientId);
    }
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
    if (filters?.scheduledFrom) {
      params.append('scheduledFrom', filters.scheduledFrom);
    }
    if (filters?.scheduledTo) {
      params.append('scheduledTo', filters.scheduledTo);
    }
    const response = await api.get<{data: Notification[], total: number}>(`/notifications?${params.toString()}`);
    return response.data;
  },

  getNotification: async (id: string): Promise<Notification> => {
    const response = await api.get<Notification>(`/notifications/${id}`);
    return response.data;
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> => {
    const response = await api.post<Notification>('/notifications', notification);
    return response.data;
  },

  updateNotification: async (id: string, notification: Partial<Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Notification> => {
    const response = await api.put<Notification>(`/notifications/${id}`, notification);
    return response.data;
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  // Announcement CRUD operations
  getAnnouncements: async (page: number = 1, limit: number = 10, search?: string, status?: string): Promise<{data: Announcement[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    if (status) {
      params.append('status', status);
    }
    const response = await api.get<{data: Announcement[], total: number}>(`/announcements?${params.toString()}`);
    return response.data;
  },

  getAnnouncement: async (id: string): Promise<Announcement> => {
    const response = await api.get<Announcement>(`/announcements/${id}`);
    return response.data;
  },

  createAnnouncement: async (data: CreateAnnouncementData): Promise<Announcement> => {
    const response = await api.post<Announcement>('/announcements', data);
    return response.data;
  },

  updateAnnouncement: async (id: string, data: Partial<CreateAnnouncementData>): Promise<Announcement> => {
    const response = await api.put<Announcement>(`/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },

  publishAnnouncement: async (id: string): Promise<Announcement> => {
    const response = await api.patch<Announcement>(`/announcements/${id}/publish`, {});
    return response.data;
  },

  archiveAnnouncement: async (id: string): Promise<Announcement> => {
    const response = await api.patch<Announcement>(`/announcements/${id}/archive`, {});
    return response.data;
  },

  // Notification Templates CRUD operations
  getNotificationTemplates: async (page: number = 1, limit: number = 10, type?: string): Promise<{data: NotificationTemplate[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (type) {
      params.append('type', type);
    }
    const response = await api.get<{data: NotificationTemplate[], total: number}>(`/notification-templates?${params.toString()}`);
    return response.data;
  },

  getNotificationTemplate: async (id: string): Promise<NotificationTemplate> => {
    const response = await api.get<NotificationTemplate>(`/notification-templates/${id}`);
    return response.data;
  },

  createNotificationTemplate: async (data: CreateNotificationTemplateData): Promise<NotificationTemplate> => {
    const response = await api.post<NotificationTemplate>('/notification-templates', data);
    return response.data;
  },

  updateNotificationTemplate: async (id: string, data: Partial<CreateNotificationTemplateData>): Promise<NotificationTemplate> => {
    const response = await api.put<NotificationTemplate>(`/notification-templates/${id}`, data);
    return response.data;
  },

  deleteNotificationTemplate: async (id: string): Promise<void> => {
    await api.delete(`/notification-templates/${id}`);
  },

  // Scheduling operations
  scheduleNotification: async (data: ScheduleNotificationData): Promise<Notification> => {
    const response = await api.post<Notification>('/notifications/schedule', data);
    return response.data;
  },

  getScheduledNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications/scheduled');
    return response.data;
  },

  cancelScheduledNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}/schedule`);
  },

  // Bulk operations
  bulkSendNotifications: async (notificationIds: string[]): Promise<{success: number, failed: number}> => {
    const response = await api.post<{success: number, failed: number}>('/notifications/bulk-send', { notificationIds });
    return response.data;
  },

  // Automated triggers
  triggerMaintenanceNotification: async (maintenanceId: string, type: 'created' | 'updated' | 'completed'): Promise<Notification> => {
    const response = await api.post<Notification>(`/notifications/trigger/maintenance/${maintenanceId}`, { type });
    return response.data;
  },

  triggerPaymentReminder: async (paymentId: string): Promise<Notification> => {
    const response = await api.post<Notification>(`/notifications/trigger/payment/${paymentId}`, {});
    return response.data;
  },

  triggerLeaseNotification: async (leaseId: string, type: 'renewal' | 'expiration' | 'signed'): Promise<Notification> => {
    const response = await api.post<Notification>(`/notifications/trigger/lease/${leaseId}`, { type });
    return response.data;
  },

  // Notification preferences
  getTenantNotificationPreferences: async (tenantId: string): Promise<{email: boolean, inApp: boolean, sms: boolean}> => {
    const response = await api.get<{email: boolean, inApp: boolean, sms: boolean}>(`/tenants/${tenantId}/notification-preferences`);
    return response.data;
  },

  updateTenantNotificationPreferences: async (tenantId: string, preferences: {email: boolean, inApp: boolean, sms: boolean}): Promise<void> => {
    await api.put(`/tenants/${tenantId}/notification-preferences`, preferences);
  },

  // User Management interfaces
  // Note: Interfaces are defined above, now adding API methods

  // Role CRUD operations
  getRoles: async (page: number = 1, limit: number = 10, filters?: RoleFilters): Promise<{data: Role[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.level) {
      params.append('level', filters.level.toString());
    }
    const response = await api.get<{data: Role[], total: number}>(`/roles?${params.toString()}`);
    return response.data;
  },

  getRole: async (id: string): Promise<Role> => {
    const response = await api.get<Role>(`/roles/${id}`);
    return response.data;
  },

  createRole: async (role: CreateRoleData): Promise<Role> => {
    const response = await api.post<Role>('/roles', role);
    return response.data;
  },

  updateRole: async (id: string, role: UpdateRoleData): Promise<Role> => {
    const response = await api.put<Role>(`/roles/${id}`, role);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },

  // User CRUD operations
  getUsers: async (page: number = 1, limit: number = 10, filters?: UserFilters): Promise<{data: User[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.roleId) {
      params.append('roleId', filters.roleId);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.lastLoginFrom) {
      params.append('lastLoginFrom', filters.lastLoginFrom);
    }
    if (filters?.lastLoginTo) {
      params.append('lastLoginTo', filters.lastLoginTo);
    }
    const response = await api.get<{data: User[], total: number}>(`/users?${params.toString()}`);
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  createUser: async (user: CreateUserData): Promise<User> => {
    const response = await api.post<User>('/users', user);
    return response.data;
  },

  updateUser: async (id: string, user: UpdateUserData): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, user);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // User invitation operations
  inviteUser: async (data: InviteUserData): Promise<UserInvitation> => {
    const response = await api.post<UserInvitation>('/users/invite', data);
    return response.data;
  },

  getUserInvitations: async (page: number = 1, limit: number = 10): Promise<{data: UserInvitation[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get<{data: UserInvitation[], total: number}>(`/users/invitations?${params.toString()}`);
    return response.data;
  },

  cancelInvitation: async (id: string): Promise<void> => {
    await api.delete(`/users/invitations/${id}`);
  },

  resendInvitation: async (id: string): Promise<UserInvitation> => {
    const response = await api.post<UserInvitation>(`/users/invitations/${id}/resend`, {});
    return response.data;
  },

  // Bulk user operations
  bulkUpdateUsers: async (data: BulkUserOperation): Promise<{success: number, failed: number}> => {
    const response = await api.post<{success: number, failed: number}>('/users/bulk', data);
    return response.data;
  },

  // Bulk role operations
  bulkUpdateRoles: async (data: BulkRoleOperation): Promise<{success: number, failed: number}> => {
    const response = await api.post<{success: number, failed: number}>('/roles/bulk', data);
    return response.data;
  },

  // Permission operations
  getPermissions: async (): Promise<Permission[]> => {
    const response = await api.get<Permission[]>('/permissions');
    return response.data;
  },

  // Audit log operations
  getAuditLogs: async (page: number = 1, limit: number = 10, filters?: {userId?: string, action?: string, resource?: string, dateFrom?: string, dateTo?: string}): Promise<{data: AuditLog[], total: number}> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resource) params.append('resource', filters.resource);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const response = await api.get<{data: AuditLog[], total: number}>(`/audit-logs?${params.toString()}`);
    return response.data;
  },

  // Password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/password-reset', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/password-reset/confirm', { token, newPassword });
  },
};

export default dashboardService;