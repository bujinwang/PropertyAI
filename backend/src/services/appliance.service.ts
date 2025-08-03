import { prisma } from '../config/database';

export const getAppliancesByRentalId = async (rentalId: string) => {
  return prisma.appliance.findMany({
    where: { rentalId },
  });
};

export const createAppliance = async (data: {
  name: string;
  rentalId: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
}) => {
  return prisma.appliance.create({
    data: {
      name: data.name,
      rentalId: data.rentalId,
      type: data.type,
    },
  });
};

export const getApplianceById = async (id: string) => {
  return prisma.appliance.findUnique({
    where: { id },
  });
};

export const updateAppliance = async (id: string, data: any) => {
  return prisma.appliance.update({
    where: { id },
    data,
  });
};

export const deleteAppliance = async (id: string) => {
  return prisma.appliance.delete({
    where: { id },
  });
};
