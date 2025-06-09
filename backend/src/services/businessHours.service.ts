import { prisma } from '../config/database';

export const getBusinessHoursByPropertyId = async (propertyId: string) => {
  return prisma.businessHours.findMany({
    where: { propertyId },
  });
};

export const createBusinessHours = async (data: {
  propertyId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}) => {
  return prisma.businessHours.create({
    data,
  });
};

export const updateBusinessHours = async (id: string, data: any) => {
  return prisma.businessHours.update({
    where: { id },
    data,
  });
};

export const deleteBusinessHours = async (id: string) => {
  return prisma.businessHours.delete({
    where: { id },
  });
};
