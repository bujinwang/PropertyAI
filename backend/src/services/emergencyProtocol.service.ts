import { prisma } from '../config/database';

export const getEmergencyProtocolsByRentalId = async (rentalId: string) => {
  return prisma.emergencyProtocol.findMany({
    where: { rentalId },
  });
};

export const createEmergencyProtocol = async (data: {
  name: string;
  description: string;
  rentalId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  contactName?: string;
  contactPhone?: string;
  instructions?: any;
}) => {
  return prisma.emergencyProtocol.create({
    data: {
      name: data.name,
      description: data.description,
      rentalId: data.rentalId,
      instructions: data.instructions,
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
