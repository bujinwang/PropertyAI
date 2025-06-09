"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = __importDefault(require("../controllers/paymentController"));
const router = (0, express_1.Router)();
router.post('/customers', paymentController_1.default.createCustomer);
router.post('/payment-intents', paymentController_1.default.createPaymentIntent);
router.post('/subscriptions', paymentController_1.default.createSubscription);
router.post('/webhooks', paymentController_1.default.handleWebhook);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map