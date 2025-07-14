import { Router } from 'express';
import { publishingController } from '../controllers/publishing.controller';

const router = Router();

router.post('/publish', publishingController.publishListing);

export default router;
