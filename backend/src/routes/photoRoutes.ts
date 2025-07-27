import express from 'express';
import * as photoController from '../controllers/photoController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/optimize', upload.single('photo') as any, photoController.optimize);

export default router;
