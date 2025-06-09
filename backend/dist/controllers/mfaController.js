"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableMFA = exports.enableMFA = exports.setupMFA = void 0;
const client_1 = require("@prisma/client");
const mfaService_1 = require("../services/mfaService");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const prisma = new client_1.PrismaClient();
const setupMFA = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return next(new errorMiddleware_1.AppError('User not found', 404));
        }
        const { secret, qrCode } = await (0, mfaService_1.generateMFASecret)(user.email);
        await prisma.user.update({
            where: { id: user.id },
            data: { mfaSecret: secret },
        });
        res.json({ secret, qrCode });
    }
    catch (error) {
        next(error);
    }
};
exports.setupMFA = setupMFA;
const enableMFA = async (req, res, next) => {
    try {
        const { token } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user || !user.mfaSecret) {
            return next(new errorMiddleware_1.AppError('MFA not set up', 400));
        }
        const isValid = (0, mfaService_1.verifyTOTP)(user.mfaSecret, token);
        if (!isValid) {
            return next(new errorMiddleware_1.AppError('Invalid MFA token', 400));
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { mfaEnabled: true },
        });
        res.json({ message: 'MFA enabled successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.enableMFA = enableMFA;
const disableMFA = async (req, res, next) => {
    try {
        const { token } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user || !user.mfaSecret) {
            return next(new errorMiddleware_1.AppError('MFA not set up', 400));
        }
        const isValid = (0, mfaService_1.verifyTOTP)(user.mfaSecret, token);
        if (!isValid) {
            return next(new errorMiddleware_1.AppError('Invalid MFA token', 400));
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { mfaEnabled: false, mfaSecret: null },
        });
        res.json({ message: 'MFA disabled successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.disableMFA = disableMFA;
//# sourceMappingURL=mfaController.js.map