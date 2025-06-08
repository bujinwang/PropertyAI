import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { addHours } from 'date-fns';

const prisma = new PrismaClient();

const PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS = 1;

export const generatePasswordResetToken = async (email: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const passwordResetExpires = addHours(new Date(), PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS);

  await prisma.user.update({
    where: { email },
    data: {
      passwordResetToken,
      passwordResetExpires,
    },
  });

  return resetToken;
};

export const verifyPasswordResetToken = async (token: string): Promise<any> => {
  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  return user;
};
