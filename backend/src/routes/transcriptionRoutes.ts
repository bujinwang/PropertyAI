import { Router } from 'express';
import TranscriptionController from '../controllers/transcriptionController';

const router = Router();

router.get('/:voicemailId', TranscriptionController.getTranscription);
router.get('/', TranscriptionController.getTranscriptions);

export default router;
