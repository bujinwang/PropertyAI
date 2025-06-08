import { Router } from 'express';
import DocumentVerificationController from '../controllers/documentVerificationController';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post(
  '/',
  upload.single('document'),
  DocumentVerificationController.analyzeDocument
);

export default router;
