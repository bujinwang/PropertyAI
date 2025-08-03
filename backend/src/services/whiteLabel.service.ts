import { prisma } from '../config/database';

export const getWhiteLabelConfigByPropertyId = async (rentalId: string) => {
  return prisma.whiteLabelConfig.findFirst({
    where: {
      Rental: {
        some: {
          id: rentalId
        }
      }
    },
  });
};

export const createWhiteLabelConfig = async (data: {
  appName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  token: string;
  platform: string;
  userId: string;
  rentalId: string;
}) => {
  return prisma.whiteLabelConfig.create({
    data: {
      appName: data.appName,
      logoUrl: data.logoUrl,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      token: data.token,
      platform: data.platform,
      userId: data.userId,
      Rental: {
        connect: { id: data.rentalId }
      },
      user: {
        connect: { id: data.userId }
      }
    } as any,
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
