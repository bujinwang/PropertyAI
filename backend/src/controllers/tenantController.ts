import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class TenantController {
  async getAllTenants(req: Request, res: Response) {
    try {
      const tenants = await prisma.user.findMany({
        where: { role: 'TENANT' },
      });
      res.status(200).json(tenants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new TenantController();
