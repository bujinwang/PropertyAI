"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = __importDefault(require("../controllers/userController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware.protect, (0, rbacMiddleware_1.rbacMiddleware)(['ADMIN']), userController_1.default.getAllUsers);
router.post('/', userController_1.default.createUser);
router.get('/:id', authMiddleware_1.authMiddleware.protect, userController_1.default.getUserById);
router.put('/:id', authMiddleware_1.authMiddleware.protect, userController_1.default.updateUser);
router.delete('/:id', authMiddleware_1.authMiddleware.protect, (0, rbacMiddleware_1.rbacMiddleware)(['ADMIN']), userController_1.default.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map