"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = void 0;
const dbManager_1 = require("../utils/dbManager");
const passwordResetService_1 = require("../services/passwordResetService");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const resetToken = await (0, passwordResetService_1.generatePasswordResetToken)(email);
        if (!resetToken) {
            return next(new errorMiddleware_1.AppError('User not found', 404));
        }
        // In a real application, you would send an email with the resetToken
        res.status(200).json({ message: 'Password reset token sent to email', resetToken });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const user = await (0, passwordResetService_1.verifyPasswordResetToken)(token);
        if (!user) {
            return next(new errorMiddleware_1.AppError('Invalid or expired password reset token', 400));
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        await dbManager_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });
        res.status(200).json({ message: 'Password has been reset' });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=passwordResetController.js.map