"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.sendPasswordResetConfirmationEmail = exports.sendRecoveryEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendRecoveryEmail = async (to, token) => {
    const recoveryLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Account Recovery',
        text: `Click the following link to recover your account: ${recoveryLink}`,
        html: `<p>Click the following link to recover your account: <a href="${recoveryLink}">${recoveryLink}</a></p>`,
    };
    await transporter.sendMail(mailOptions);
};
exports.sendRecoveryEmail = sendRecoveryEmail;
const sendPasswordResetConfirmationEmail = async (to) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Password Reset Confirmation',
        text: 'Your password has been successfully reset.',
        html: '<p>Your password has been successfully reset.</p>',
    };
    await transporter.sendMail(mailOptions);
};
exports.sendPasswordResetConfirmationEmail = sendPasswordResetConfirmationEmail;
const sendEmail = async (to, subject, text, html) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
    };
    await transporter.sendMail(mailOptions);
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=emailService.js.map