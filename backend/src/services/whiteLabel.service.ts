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
      // `user: { connect }` removed. No such relation exists -- it is `User`
      // (capital), and `userId` above already sets the FK. Verified:
      //   Unknown argument `user`. Did you mean `userId`?
      // The whole payload was `as any`, so `tsc` never objected and every
      // create threw at runtime. No cast needed now that the shape is real.
    },
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
