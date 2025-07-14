import { Request, Response } from 'express';
import KnowledgeBaseService from '../services/knowledgeBaseService';

class KnowledgeBaseController {
  async createEntry(req: Request, res: Response) {
    try {
      const entry = await KnowledgeBaseService.createEntry(req.body);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEntry(req: Request, res: Response) {
    try {
      const entry = await KnowledgeBaseService.getEntry(req.params.id);
      if (entry) {
        res.status(200).json(entry);
      } else {
        res.status(404).json({ message: 'Entry not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEntries(req: Request, res: Response) {
    try {
      const entries = await KnowledgeBaseService.getEntries();
      res.status(200).json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateEntry(req: Request, res: Response) {
    try {
      const entry = await KnowledgeBaseService.updateEntry(
        req.params.id,
        req.body
      );
      res.status(200).json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteEntry(req: Request, res: Response) {
    try {
      await KnowledgeBaseService.deleteEntry(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new KnowledgeBaseController();
