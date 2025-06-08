import { Request, Response } from 'express';
import AuditService from '../services/auditService';

class AuditController {
  async createEntry(req: Request, res: Response) {
    try {
      const entry = await AuditService.createEntry(req.body);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEntries(req: Request, res: Response) {
    try {
      const entries = await AuditService.getEntries();
      res.status(200).json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AuditController();
