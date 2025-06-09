"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const database_1 = require("../config/database");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
});
class PaymentService {
    async createPaymentIntent(amount, currency, customerId) {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            customer: customerId,
        });
        return paymentIntent;
    }
    async handleSuccessfulPayment(paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const transaction = await database_1.prisma.transaction.updateMany({
            where: {
                reference: paymentIntent.id,
            },
            data: {
                status: 'COMPLETED',
                processedAt: new Date(),
            },
        });
        return transaction;
    }
}
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map