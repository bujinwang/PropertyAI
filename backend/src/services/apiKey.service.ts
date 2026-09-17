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

/**
 * Looks up a single API key by id.
 *
 * Used by the controller to verify ownership before mutating a key, since the
 * key table has no other way to attribute a row to its principal.
 */
export const getApiKeyById = async (id: string) => {
  return prisma.apiKey.findUnique({
    where: { id },
  });
};

export const deleteApiKey = async (id: string) => {
  return prisma.apiKey.delete({
    where: { id },
  });
};
