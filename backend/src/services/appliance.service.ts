import { prisma } from '../config/database';

export const getAppliancesByUnitId = async (unitId: string) => {
  return prisma.appliance.findMany({
    where: { unitId },
  });
};

export const createAppliance = async (data: {
  unitId: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
}) => {
  return prisma.appliance.create({
    data,
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
