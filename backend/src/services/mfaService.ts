import { prisma } from '../utils/dbManager';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

export const generateMFASecret = async (email: string) => {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, 'PropertyAI', secret);
  const qrCode = await toDataURL(otpauth);

  return { secret, qrCode };
};

export const getMFASecret = async (userId: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.mfaSecret || null;
};

export const isMFAEnabled = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.mfaEnabled || false;
};

export const enableMFA = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  });
};

export const disableMFA = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: false, mfaSecret: null },
  });
};

export const verifyTOTP = (secret: string, token: string): boolean => {
  return authenticator.verify({ token, secret });
};
