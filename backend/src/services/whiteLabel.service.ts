import { prisma } from '../config/database';

export const getWhiteLabelConfigByPropertyId = async (propertyId: string) => {
  return prisma.whiteLabelConfig.findUnique({
    where: { propertyId },
  });
};

export const createWhiteLabelConfig = async (data: {
  propertyId: string;
  appName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}) => {
  return prisma.whiteLabelConfig.create({
    data,
  });
};

export const updateWhiteLabelConfig = async (id: string, data: any) => {
  return prisma.whiteLabelConfig.update({
    where: { id },
    data,
  });
};

export const deleteWhiteLabelConfig = async (id: string) => {
  return prisma.whiteLabelConfig.delete({
    where: { id },
  });
};
