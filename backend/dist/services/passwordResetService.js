"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPasswordResetToken = exports.generatePasswordResetToken = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
const PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS = 1;
const generatePasswordResetToken = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return null;
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const passwordResetToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = (0, date_fns_1.addHours)(new Date(), PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS);
    await prisma.user.update({
        where: { email },
        data: {
            passwordResetToken,
            passwordResetExpires,
        },
    });
    return resetToken;
};
exports.generatePasswordResetToken = generatePasswordResetToken;
const verifyPasswordResetToken = async (token) => {
    const passwordResetToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken,
            passwordResetExpires: { gt: new Date() },
        },
    });
    return user;
};
exports.verifyPasswordResetToken = verifyPasswordResetToken;
//# sourceMappingURL=passwordResetService.js.map