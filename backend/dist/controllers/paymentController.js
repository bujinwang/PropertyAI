"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const paymentService_1 = __importDefault(require("../services/paymentService"));
class PaymentController {
    async createCustomer(req, res) {
        try {
            const customer = await paymentService_1.default.createCustomer(req.body.email, req.body.name);
            res.status(201).json(customer);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createPaymentIntent(req, res) {
        try {
            const paymentIntent = await paymentService_1.default.createPaymentIntent(req.body.amount, req.body.currency);
            res.status(201).json(paymentIntent);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createSubscription(req, res) {
        try {
            const subscription = await paymentService_1.default.createSubscription(req.body.customerId, req.body.priceId);
            res.status(201).json(subscription);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async handleWebhook(req, res) {
        try {
            const event = req.body;
            if (event.type === 'payment_intent.payment_failed') {
                await paymentService_1.default.handleFailedPayment(event.data.object.id);
            }
            res.status(200).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new PaymentController();
//# sourceMappingURL=paymentController.js.map