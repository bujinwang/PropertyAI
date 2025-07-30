import { prisma } from '../config/database';
import { randomBytes } from 'crypto';

export const generateApiKey = async (userId: string, permissions: string[], expiresAt?: Date) => {
  const key = randomBytes(32).toString('hex');
  return prisma.apiKey.create({
    data: {
      key,
      userId,
      expiresAt,
    },
  });
};

export const getApiKeysByUserId = async (userId: string) => {
  return prisma.apiKey.findMany({
    where: { userId },
  });
};

export const deleteApiKey = async (id: string) => {
  return prisma.apiKey.delete({
    where: { id },
  });
};
