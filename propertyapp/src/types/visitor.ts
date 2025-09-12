export interface Visitor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  visitDate: string;
  visitTime?: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED' | 'CANCELLED';
  accessCode?: string;
  qrCode?: string;
  notes?: string;
  photoUrl?: string;
  requestedById: string;
  rentalId: string;
  approvedById?: string;
  approvedAt?: string;
  deniedAt?: string;
  deniedReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  requestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rental?: {
    id: string;
    title: string;
    address: string;
  };
}

export interface Delivery {
  id: string;
  trackingNumber: string;
  carrier: string;
  sender: string;
  description: string;
  status: 'IN_TRANSIT' | 'DELIVERED' | 'PICKED_UP' | 'RETURNED' | 'LOST';
  deliveryDate?: string;
  pickupCode?: string;
  qrCode?: string;
  location?: string;
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
  photoUrl?: string;
  rentalId: string;
  notifiedAt?: string;
  pickedUpAt?: string;
  pickedUpById?: string;
  createdAt: string;
  updatedAt: string;
  pickedUpBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface VisitorAccessLog {
  id: string;
  visitorId: string;
  accessTime: string;
  accessType: 'ENTRY' | 'EXIT';
  location?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface DeliveryAccessLog {
  id: string;
  deliveryId: string;
  accessTime: string;
  accessType: 'DELIVERED' | 'PICKED_UP';
  location?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
}