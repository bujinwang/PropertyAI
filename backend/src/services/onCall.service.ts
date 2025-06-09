import { prisma } from '../config/database';

export const getOnCallSchedulesByPropertyId = async (propertyId: string) => {
  return prisma.onCallSchedule.findMany({
    where: { propertyId },
    include: { rotations: true },
  });
};

export const createOnCallSchedule = async (data: {
  name: string;
  description?: string;
  propertyId: string;
}) => {
  return prisma.onCallSchedule.create({
    data,
  });
};

export const updateOnCallSchedule = async (id: string, data: any) => {
  return prisma.onCallSchedule.update({
    where: { id },
    data,
  });
};

export const deleteOnCallSchedule = async (id: string) => {
  return prisma.onCallSchedule.delete({
    where: { id },
  });
};

export const createOnCallRotation = async (data: {
  scheduleId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
}) => {
  return prisma.onCallRotation.create({
    data,
  });
};

export const updateOnCallRotation = async (id: string, data: any) => {
  return prisma.onCallRotation.update({
    where: { id },
    data,
  });
};

export const deleteOnCallRotation = async (id: string) => {
  return prisma.onCallRotation.delete({
    where: { id },
  });
};
