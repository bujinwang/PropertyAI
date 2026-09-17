import { Router } from 'express';
import * as roleController from '../controllers/role.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/roles', roleController.getRoles);
// Role mutations are privileged: any authenticated tenant must not be able to
// create/alter/delete roles. `protect` establishes req.user, `admin` enforces
// the ADMIN role.
router.post('/roles', authMiddleware.protect, authMiddleware.admin, roleController.createRole);
router.put('/roles/:id', authMiddleware.protect, authMiddleware.admin, roleController.updateRole);
router.delete('/roles/:id', authMiddleware.protect, authMiddleware.admin, roleController.deleteRole);

router.get('/permissions', roleController.getPermissions);

export default router;
