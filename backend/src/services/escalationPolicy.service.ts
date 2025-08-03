import { prisma } from '../config/database';

export const getEscalationPoliciesByPropertyId = async (rentalId: string) => {
  return prisma.escalationPolicy.findMany({
    where: { rentalId },
    include: { EscalationPolicyRule: true }, // Changed from 'rules' to 'EscalationPolicyRule'
  });
};

export const createEscalationPolicy = async (data: {
  name: string;
  description?: string;
  rentalId: string;
}) => {
  return prisma.escalationPolicy.create({
    data,
  });
};

export const updateEscalationPolicy = async (id: string, data: any) => {
  return prisma.escalationPolicy.update({
    where: { id },
    data,
  });
};

export const deleteEscalationPolicy = async (id: string) => {
  return prisma.escalationPolicy.delete({
    where: { id },
  });
};

export const createEscalationPolicyRule = async (data: {
  policyId: string;
  userId: string; // Added userId as it's required by schema
  order: number; // Added order as it's required by schema
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  escalateToId: string;
  delayMinutes: number;
}) => {
  return prisma.escalationPolicyRule.create({
    data: {
      policyId: data.policyId,
      order: data.order,
      threshold: `${data.delayMinutes}m`, // Convert delay to threshold format
      action: 'escalate', // Default action
      assignedToUserId: data.userId,
    },
  });
};

export const updateEscalationPolicyRule = async (id: string, data: any) => {
  return prisma.escalationPolicyRule.update({
    where: { id },
    data,
  });
};

export const deleteEscalationPolicyRule = async (id: string) => {
  return prisma.escalationPolicyRule.delete({
    where: { id },
  });
};
