import { Router } from 'express';
import SuggestionController from '../controllers/suggestionController';

const router = Router();

router.get('/', SuggestionController.getSuggestions);

export default router;
