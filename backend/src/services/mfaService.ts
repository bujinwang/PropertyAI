import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

const prisma = new PrismaClient();

export const generateMFASecret = async (email: string) => {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, 'PropertyAI', secret);
  const qrCode = await toDataURL(otpauth);

  return { secret, qrCode };
};

export const verifyMFAToken = (token: string, secret: string): boolean => {
  return authenticator.verify({ token, secret });
};
