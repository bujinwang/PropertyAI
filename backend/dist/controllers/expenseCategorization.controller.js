"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorizeExpense = void 0;
const expenseCategorization_service_1 = require("../services/expenseCategorization.service");
const logger_1 = __importDefault(require("../utils/logger"));
const categorizeExpense = async (req, res) => {
    const { transactionId } = req.params;
    if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }
    try {
        const category = await expenseCategorization_service_1.expenseCategorizationService.categorizeExpense(transactionId);
        res.status(200).json({ category });
    }
    catch (error) {
        logger_1.default.error(`Error categorizing expense: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.categorizeExpense = categorizeExpense;
//# sourceMappingURL=expenseCategorization.controller.js.map