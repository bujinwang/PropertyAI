"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaseController_1 = __importDefault(require("../controllers/leaseController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware.protect, leaseController_1.default.getAllLeases);
router.post('/', authMiddleware_1.authMiddleware.protect, leaseController_1.default.createLease);
router.get('/:id', authMiddleware_1.authMiddleware.protect, leaseController_1.default.getLeaseById);
router.put('/:id', authMiddleware_1.authMiddleware.protect, leaseController_1.default.updateLease);
router.delete('/:id', authMiddleware_1.authMiddleware.protect, leaseController_1.default.deleteLease);
exports.default = router;
//# sourceMappingURL=leaseRoutes.js.map