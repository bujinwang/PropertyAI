import { Router } from 'express';
import { seoController } from '../controllers/seo.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/optimize-listing', upload.single('image'), seoController.optimizeListing);

export default router;
