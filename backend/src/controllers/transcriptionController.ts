import { Request, Response } from 'express';
import Transcription from '../models/mongo/Transcription';

class TranscriptionController {
  async getTranscription(req: Request, res: Response) {
    try {
      const transcription = await Transcription.findOne({
        voicemailId: req.params.voicemailId,
      });
      if (transcription) {
        res.status(200).json(transcription);
      } else {
        res.status(404).json({ message: 'Transcription not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTranscriptions(req: Request, res: Response) {
    try {
      const transcriptions = await Transcription.find();
      res.status(200).json(transcriptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new TranscriptionController();
