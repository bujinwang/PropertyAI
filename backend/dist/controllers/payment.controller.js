"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSuccessfulPayment = exports.createPaymentIntent = void 0;
const payment_service_1 = require("../services/payment.service");
const logger_1 = __importDefault(require("../utils/logger"));
const createPaymentIntent = async (req, res) => {
    const { amount, currency, customerId } = req.body;
    if (!amount || !currency || !customerId) {
        return res.status(400).json({ error: 'Amount, currency, and customer ID are required' });
    }
    try {
        const paymentIntent = await payment_service_1.paymentService.createPaymentIntent(amount, currency, customerId);
        res.status(200).json(paymentIntent);
    }
    catch (error) {
        logger_1.default.error(`Error creating payment intent: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createPaymentIntent = createPaymentIntent;
const handleSuccessfulPayment = async (req, res) => {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    try {
        const transaction = await payment_service_1.paymentService.handleSuccessfulPayment(paymentIntentId);
        res.status(200).json(transaction);
    }
    catch (error) {
        logger_1.default.error(`Error handling successful payment: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.handleSuccessfulPayment = handleSuccessfulPayment;
//# sourceMappingURL=payment.controller.js.map