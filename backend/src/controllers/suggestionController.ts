import { Request, Response } from 'express';
import SuggestionService from '../services/suggestionService';

class SuggestionController {
  async getSuggestions(req: Request, res: Response) {
    try {
      const { query } = req.query;
      if (typeof query !== 'string') {
        return res.status(400).json({ message: 'Query must be a string' });
      }
      const suggestions = await SuggestionService.getSuggestions(query);
      res.status(200).json(suggestions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new SuggestionController();
