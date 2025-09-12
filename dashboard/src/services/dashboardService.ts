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
};

export default dashboardService;