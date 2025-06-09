import { Request, Response } from 'express';
import AuditService from '../services/auditService';

class AuditController {
  async createEntry(req: Request, res: Response) {
    try {
      const { userId, action, details } = req.body;
      await AuditService.createAuditEntry(userId, action, details);
      res.status(201).json({ message: 'Audit entry created successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEntries(req: Request, res: Response) {
    try {
      const entries = await AuditService.getAuditEntries();
      res.status(200).json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AuditController();
