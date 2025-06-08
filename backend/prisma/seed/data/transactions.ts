import { TransactionType, TransactionStatus } from '@prisma/client';

interface TransactionSeed {
  id?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  createdAt?: Date | string;
  processedAt?: Date | string | null;
  paymentMethod?: string;
  leaseId: string;
  reference?: string;
  notes?: string;
}

// Lease IDs - These would match the IDs generated for leases
const LEASE1_ID = '1'; // Unit 101 - John
const LEASE2_ID = '2'; // Unit 102 - Emma
const LEASE3_ID = '3'; // Unit A1 - David
const LEASE4_ID = '4'; // Oakridge House - Lisa
const LEASE5_ID = '5'; // Unit 1A - James
const LEASE6_ID = '6'; // Unit 2B - Olivia

export const transactions: TransactionSeed[] = [
  // Rent payments
  {
    amount: 2500,
    type: TransactionType.RENT,
    status: TransactionStatus.COMPLETED,
    description: 'Monthly rent payment for May 2024',
    createdAt: new Date('2024-05-01'),
    processedAt: new Date('2024-05-01'),
    paymentMethod: 'Credit Card',
    leaseId: LEASE1_ID,
    reference: 'RENT-2024-05-101',
  },
  {
    amount: 2700,
    type: TransactionType.RENT,
    status: TransactionStatus.COMPLETED,
    description: 'Monthly rent payment for May 2024',
    createdAt: new Date('2024-05-01'),
    processedAt: new Date('2024-05-01'),
    paymentMethod: 'Bank Transfer',
    leaseId: LEASE2_ID,
    reference: 'RENT-2024-05-102',
  },
  {
    amount: 3800,
    type: TransactionType.RENT,
    status: TransactionStatus.COMPLETED,
    description: 'Monthly rent payment for May 2024',
    createdAt: new Date('2024-05-01'),
    processedAt: new Date('2024-05-01'),
    paymentMethod: 'Bank Transfer',
    leaseId: LEASE3_ID,
    reference: 'RENT-2024-05-A1',
  },
  {
    amount: 5500,
    type: TransactionType.RENT,
    status: TransactionStatus.COMPLETED,
    description: 'Monthly rent payment for May 2024',
    createdAt: new Date('2024-05-01'),
    processedAt: new Date('2024-05-01'),
    paymentMethod: 'Check',
    leaseId: LEASE4_ID,
    reference: 'RENT-2024-05-MAIN',
  },
  {
    amount: 3000,
    type: TransactionType.RENT,
    status: TransactionStatus.COMPLETED,
    description: 'Monthly rent payment for May 2024',
    createdAt: new Date('2024-05-01'),
    processedAt: new Date('2024-05-01'),
    paymentMethod: 'Credit Card',
    leaseId: LEASE5_ID,
    reference: 'RENT-2024-05-1A',
  },
  {
    amount: 3900,
    type: TransactionType.RENT,
    status: TransactionStatus.COMPLETED,
    description: 'Monthly rent payment for May 2024',
    createdAt: new Date('2024-05-01'),
    processedAt: new Date('2024-05-01'),
    paymentMethod: 'Bank Transfer',
    leaseId: LEASE6_ID,
    reference: 'RENT-2024-05-2B',
  },
  
  // Security deposit returns
  {
    amount: -1800,
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.COMPLETED,
    description: 'Security deposit refund - previous tenant',
    createdAt: new Date('2024-03-15'),
    processedAt: new Date('2024-03-15'),
    paymentMethod: 'Bank Transfer',
    leaseId: LEASE2_ID, // Just using one of the leases for this example
    reference: 'DEP-REFUND-2024-03',
    notes: 'Partial refund due to carpet cleaning and minor repairs.',
  },
  
  // Maintenance charges
  {
    amount: 245.75,
    type: TransactionType.MAINTENANCE,
    status: TransactionStatus.COMPLETED,
    description: 'Kitchen faucet replacement',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    processedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    leaseId: LEASE5_ID, // James - Bayview Condos Unit 1A
    reference: 'MAINT-2024-05-001',
    notes: 'Upgraded to Delta touchless faucet model #4380T-DST.',
  },
  
  // Late fees
  {
    amount: 100,
    type: TransactionType.FEES,
    status: TransactionStatus.COMPLETED,
    description: 'Late fee for April 2024 rent',
    createdAt: new Date('2024-04-06'),
    processedAt: new Date('2024-04-06'),
    leaseId: LEASE6_ID, // Olivia - Bayview Condos Unit 2B
    reference: 'LATE-2024-04-2B',
    notes: 'Rent payment received 5 days late.',
  },
  
  // Utility payments
  {
    amount: 85.50,
    type: TransactionType.OTHER,
    status: TransactionStatus.COMPLETED,
    description: 'Water and sewer charges for April 2024',
    createdAt: new Date('2024-05-01'),
    processedAt: new Date('2024-05-01'),
    leaseId: LEASE1_ID, // John - Sunrise Apartments Unit 101
    reference: 'UTIL-2024-04-101',
  },
  {
    amount: 92.75,
    type: TransactionType.OTHER,
    status: TransactionStatus.COMPLETED,
    description: 'Water and sewer charges for April 2024',
    createdAt: new Date('2024-05-01'),
    processedAt: new Date('2024-05-01'),
    leaseId: LEASE2_ID, // Emma - Sunrise Apartments Unit 102
    reference: 'UTIL-2024-04-102',
  },
  
  // Pending transactions
  {
    amount: 2500,
    type: TransactionType.RENT,
    status: TransactionStatus.PENDING,
    description: 'Monthly rent payment for June 2024',
    createdAt: new Date('2024-06-01'),
    processedAt: null,
    paymentMethod: 'Credit Card',
    leaseId: LEASE1_ID, // John - Sunrise Apartments Unit 101
    reference: 'RENT-2024-06-101',
    notes: 'Payment scheduled.',
  },
  
  // Failed transaction
  {
    amount: 3800,
    type: TransactionType.RENT,
    status: TransactionStatus.FAILED,
    description: 'Failed monthly rent payment for April 2024',
    createdAt: new Date('2024-04-01'),
    processedAt: new Date('2024-04-01'),
    paymentMethod: 'Credit Card',
    leaseId: LEASE3_ID, // David - Parkview Townhomes Unit A1
    reference: 'RENT-2024-04-A1-FAILED',
    notes: 'Transaction declined due to insufficient funds. Successfully processed via alternative payment method the next day.',
  },
  {
    amount: 3800,
    type: TransactionType.RENT,
    status: TransactionStatus.COMPLETED,
    description: 'Monthly rent payment for April 2024 (second attempt)',
    createdAt: new Date('2024-04-02'),
    processedAt: new Date('2024-04-02'),
    paymentMethod: 'Bank Transfer',
    leaseId: LEASE3_ID, // David - Parkview Townhomes Unit A1
    reference: 'RENT-2024-04-A1',
  },
]; 