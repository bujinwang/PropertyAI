"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.forgotPassword = exports.resetPassword = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const tokenService_1 = require("../services/tokenService");
const emailService_1 = require("../services/emailService");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const lockout_config_1 = require("../config/lockout.config");
const prisma = new client_1.PrismaClient();
const register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role,
            },
        });
        res.status(201).json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const hashedToken = require('crypto').createHash('sha256').update(token).digest('hex');
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { gt: new Date() },
            },
        });
        if (!user) {
            return next(new errorMiddleware_1.AppError('Token is invalid or has expired', 400));
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
                failedLoginAttempts: 0,
                isLocked: false,
                lockedUntil: null,
            },
        });
        await (0, emailService_1.sendPasswordResetConfirmationEmail)(user.email);
        await prisma.auditEntry.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_RESET',
                details: `Password reset for user ${user.email}`,
            },
        });
        res.json({ message: 'Password has been reset' });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            const token = (0, tokenService_1.generateRecoveryToken)();
            const hashedToken = await bcryptjs_1.default.hash(token, 10);
            const expires = new Date(Date.now() + 3600000); // 1 hour
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: hashedToken,
                    passwordResetExpires: expires,
                },
            });
            await (0, emailService_1.sendRecoveryEmail)(user.email, token);
            await prisma.auditEntry.create({
                data: {
                    userId: user.id,
                    action: 'PASSWORD_RESET_REQUESTED',
                    details: `Password reset requested for user ${user.email}`,
                },
            });
        }
        // Always return a success message to prevent user enumeration
        res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return next(new errorMiddleware_1.AppError('Invalid credentials', 401));
        }
        if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
            return next(new errorMiddleware_1.AppError('Account locked. Please try again later.', 403));
        }
        if (await bcryptjs_1.default.compare(password, user.password)) {
            await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: 0, isLocked: false, lockedUntil: null },
            });
            const token = (0, tokenService_1.generateToken)(user);
            res.json({ token });
        }
        else {
            const newFailedAttempts = user.failedLoginAttempts + 1;
            let isLocked = user.isLocked;
            let lockedUntil = user.lockedUntil;
            if (newFailedAttempts >= lockout_config_1.lockoutConfig.maxFailedAttempts) {
                isLocked = true;
                lockedUntil = new Date(Date.now() + lockout_config_1.lockoutConfig.lockoutDurationMinutes * 60 * 1000);
            }
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newFailedAttempts,
                    isLocked,
                    lockedUntil,
                },
            });
            return next(new errorMiddleware_1.AppError('Invalid credentials', 401));
        }
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
//# sourceMappingURL=authController.js.map