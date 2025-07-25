export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  vendor?: Vendor;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  specialty: string;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  serviceAreas: string[];
  certifications: string[];
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  propertyId: string;
  unitId?: string;
  requestedById: string;
  property: Property;
  unit?: Unit;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  maintenanceRequestId: string;
  maintenanceRequest: MaintenanceRequest;
  assignments: WorkOrderAssignment[];
  quotes: WorkOrderQuote[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderAssignment {
  id: string;
  workOrderId: string;
  vendorId: string;
  vendor: Vendor;
  assignedAt: string;
}

export interface WorkOrderQuote {
  id: string;
  workOrderId: string;
  vendorId: string;
  amount: number;
  details: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  maintenanceRequestId: string;
  conversationId: string;
  createdAt: string;
}

export type WorkOrderStatus = 
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}
