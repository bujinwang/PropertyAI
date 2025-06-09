"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
class PaymentService {
    constructor() {
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-05-28.basil',
        });
    }
    async createCustomer(email, name) {
        return this.stripe.customers.create({ email, name });
    }
    async createPaymentIntent(amount, currency) {
        return this.stripe.paymentIntents.create({
            amount,
            currency,
        });
    }
    async createSubscription(customerId, priceId) {
        return this.stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
        });
    }
    async handleFailedPayment(paymentIntentId) {
        var _a;
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        // Notify user and admin
        console.log('Payment failed:', (_a = paymentIntent.last_payment_error) === null || _a === void 0 ? void 0 : _a.message);
    }
}
exports.default = new PaymentService();
//# sourceMappingURL=paymentService.js.map