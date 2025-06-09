"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactionController_1 = __importDefault(require("../controllers/transactionController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware.protect, transactionController_1.default.getAllTransactions);
router.post('/', authMiddleware_1.authMiddleware.protect, transactionController_1.default.createTransaction);
router.get('/:id', authMiddleware_1.authMiddleware.protect, transactionController_1.default.getTransactionById);
router.put('/:id', authMiddleware_1.authMiddleware.protect, transactionController_1.default.updateTransaction);
router.delete('/:id', authMiddleware_1.authMiddleware.protect, transactionController_1.default.deleteTransaction);
exports.default = router;
//# sourceMappingURL=transactionRoutes.js.map