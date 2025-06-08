import express from 'express';
import * as voiceController from '../controllers/voiceController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/transcribe', upload.single('audio'), voiceController.transcribe);

export default router;
