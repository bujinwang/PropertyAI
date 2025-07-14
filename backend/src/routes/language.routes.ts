import { Router } from 'express';
import * as languageController from '../controllers/language.controller';

const router = Router();

router.get('/languages', languageController.getLanguages);
router.post('/languages', languageController.createLanguage);
router.put('/languages/:id', languageController.updateLanguage);
router.delete('/languages/:id', languageController.deleteLanguage);

export default router;
