import { Router } from 'express';
import * as roleController from '../controllers/role.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/roles', roleController.getRoles);
// KNOWN RESIDUAL (accepted): the two GETs below are reachable by ANY
// authenticated user — the global fail-closed guard (app.use('/api', requireAuth))
// ensures a valid JWT is required, but there is no role gate here. This is
// deliberate: `/roles` and `/permissions` are low-sensitivity role/permission
// *enumeration* (labels + IDs, no end-user data), and the dashboard's
// administration UI reads them. Only the MUTATIONS are ADMIN-gated. If role
// enumeration is ever deemed sensitive, gate these with
// `authMiddleware.protect, authMiddleware.admin` too.
router.get('/permissions', roleController.getPermissions);
// Role mutations are privileged: any authenticated tenant must not be able to
// create/alter/delete roles. `protect` establishes req.user, `admin` enforces
// the ADMIN role.
router.post('/roles', authMiddleware.protect, authMiddleware.admin, roleController.createRole);
router.put('/roles/:id', authMiddleware.protect, authMiddleware.admin, roleController.updateRole);
router.delete('/roles/:id', authMiddleware.protect, authMiddleware.admin, roleController.deleteRole);

export default router;
