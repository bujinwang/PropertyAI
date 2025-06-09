import { prisma } from '../config/database';

export const getEmergencyProtocolsByPropertyId = async (propertyId: string) => {
  return prisma.emergencyProtocol.findMany({
    where: { propertyId },
  });
};

export const createEmergencyProtocol = async (data: {
  propertyId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  contactName: string;
  contactPhone: string;
  instructions: string;
}) => {
  return prisma.emergencyProtocol.create({
    data,
  });
};

export const updateEmergencyProtocol = async (id: string, data: any) => {
  return prisma.emergencyProtocol.update({
    where: { id },
    data,
  });
};

export const deleteEmergencyProtocol = async (id: string) => {
  return prisma.emergencyProtocol.delete({
    where: { id },
  });
};
