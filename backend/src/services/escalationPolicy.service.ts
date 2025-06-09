import { prisma } from '../config/database';

export const getEscalationPoliciesByPropertyId = async (propertyId: string) => {
  return prisma.escalationPolicy.findMany({
    where: { propertyId },
    include: { rules: true },
  });
};

export const createEscalationPolicy = async (data: {
  name: string;
  description?: string;
  propertyId: string;
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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  escalateToId: string;
  delayMinutes: number;
}) => {
  return prisma.escalationPolicyRule.create({
    data,
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
