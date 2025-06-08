import { Request, Response } from 'express';
import DocumentVerificationService from '../services/documentVerificationService';

class DocumentVerificationController {
  async analyzeDocument(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const result = await DocumentVerificationService.analyzeDocument(
        req.file.path
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new DocumentVerificationController();
