import pino from 'pino';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:standard',
    },
  },
});

class AuditService {
  async logAction(userId: string, action: string, details?: any) {
    const logEntry = {
      userId,
      action,
      details,
      timestamp: new Date(),
    };

    logger.info(logEntry, 'Audit Trail');

    await prisma.auditEntry.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : Prisma.JsonNull,
      },
    });
  }
}

export const auditService = new AuditService();
