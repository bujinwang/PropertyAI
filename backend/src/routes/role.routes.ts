import { Router } from 'express';
import * as roleController from '../controllers/role.controller';

const router = Router();

router.get('/roles', roleController.getRoles);
router.post('/roles', roleController.createRole);
router.put('/roles/:id', roleController.updateRole);
router.delete('/roles/:id', roleController.deleteRole);

router.get('/permissions', roleController.getPermissions);

export default router;
