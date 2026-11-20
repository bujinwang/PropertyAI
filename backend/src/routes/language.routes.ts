import { Router } from 'express';
import * as languageController from '../controllers/language.controller';
import { checkRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

/**
 * `/api/languages` — a GLOBAL reference table (`Language { code @unique, name }`).
 *
 * WHY THE GATE IS HERE AND NOT IN THE CONTROLLER
 * ----------------------------------------------
 * The controller had zero `req.user` reads, so any authenticated user could
 * rewrite the platform's language list. But note *where* the fix belongs: there
 * is no `rentalId`, no owner, and no "is this YOUR row?" question on a global
 * lookup table — a row-level check after a fetch would be answering a question
 * that does not exist. `checkRole` on the router is therefore not a shortcut,
 * it is the correct control for global data.
 *
 * Same distinction as `/api/marketing` and `/api/knowledge-base`: global rows
 * get a router gate; rows hanging off a parent get a controller check.
 *
 * Reads stay open to any authenticated caller (the global `requireAuth` mount
 * already guarantees that) because translation pickers need the list. Writes are
 * platform configuration -> operator roles only.
 */

const router = Router();

const LANGUAGE_EDITORS: UserRole[] = [UserRole.ADMIN, UserRole.PROPERTY_MANAGER];

router.get('/languages', languageController.getLanguages);

router.post('/languages', checkRole(LANGUAGE_EDITORS), languageController.createLanguage);
router.put('/languages/:id', checkRole(LANGUAGE_EDITORS), languageController.updateLanguage);
router.delete('/languages/:id', checkRole(LANGUAGE_EDITORS), languageController.deleteLanguage);

export default router;
