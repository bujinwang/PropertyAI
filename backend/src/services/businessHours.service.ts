import { prisma } from '../config/database';

export const getBusinessHoursByRentalId = async (rentalId: string) => {
  return prisma.businessHours.findMany({
    where: { rentalId },
  });
};

export const createBusinessHours = async (data: {
  rentalId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}) => {
  return prisma.businessHours.create({
    data: {
      rentalId: data.rentalId,
      dayOfWeek: data.dayOfWeek,
      openTime: data.openTime,
      closeTime: data.closeTime,
      isClosed: data.isClosed,
    },
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
