"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const authMiddleware_1 = require("../middleware/authMiddleware");
const serviceUtils_1 = require("../utils/serviceUtils");
const userController_1 = __importDefault(require("../controllers/userController"));
const router = express_1.default.Router();
// Generic User CRUD routes
router.post('/', authMiddleware_1.authMiddleware.protect, authMiddleware_1.authMiddleware.admin, userController_1.default.createUser);
router.get('/', authMiddleware_1.authMiddleware.protect, authMiddleware_1.authMiddleware.admin, userController_1.default.getAllUsers);
router.get('/:id', authMiddleware_1.authMiddleware.protect, authMiddleware_1.authMiddleware.admin, userController_1.default.getUserById);
router.put('/:id', authMiddleware_1.authMiddleware.protect, authMiddleware_1.authMiddleware.admin, userController_1.default.updateUser);
router.delete('/:id', authMiddleware_1.authMiddleware.protect, authMiddleware_1.authMiddleware.admin, userController_1.default.deleteUser);
/**
 * @route   GET /api/users/validate/:id
 * @desc    Validate if a user exists and is active (for inter-service communication)
 * @access  Internal
 */
router.get('/validate/:id', async (req, res, next) => {
    try {
        // Check if this is an internal service call
        const isInternalCall = req.headers['x-internal-service-call'] === 'true';
        if (!isInternalCall) {
            throw new serviceUtils_1.ServiceCommunicationError('Unauthorized access to internal endpoint', 403);
        }
        const { id } = req.params;
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                isActive: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route   GET /api/users/basic/:id
 * @desc    Get basic user information (for inter-service communication)
 * @access  Internal
 */
router.get('/basic/:id', async (req, res, next) => {
    try {
        // Check if this is an internal service call
        const isInternalCall = req.headers['x-internal-service-call'] === 'true';
        if (!isInternalCall) {
            throw new serviceUtils_1.ServiceCommunicationError('Unauthorized access to internal endpoint', 403);
        }
        const { id } = req.params;
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        next(error);
    }
});
// Export the router
exports.default = router;
//# sourceMappingURL=usersRoutes.js.map