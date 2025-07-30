import { prisma } from '../config/database';

export const getEmergencyProtocolsByPropertyId = async (propertyId: string) => {
  return prisma.emergencyProtocol.findMany({
    where: { propertyId },
  });
};

export const createEmergencyProtocol = async (data: {
  name: string; // Added name as it's required by schema
  description: string; // Added description as it's required by schema
  propertyId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  contactName: string;
  contactPhone: string;
  instructions: string;
}) => {
  return prisma.emergencyProtocol.create({
    data: {
      ...data,
      name: data.name,
      description: data.description,
    },
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
