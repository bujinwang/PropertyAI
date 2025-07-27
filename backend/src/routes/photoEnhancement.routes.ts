import { Router } from 'express';
import { photoEnhancementController } from '../controllers/photoEnhancement.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/enhance-photo', upload.single('image') as any, photoEnhancementController.enhancePhoto);

export default router;
