"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTOTP = exports.disableMFA = exports.enableMFA = exports.isMFAEnabled = exports.getMFASecret = exports.generateMFASecret = void 0;
const dbManager_1 = require("../utils/dbManager");
const otplib_1 = require("otplib");
const qrcode_1 = require("qrcode");
const generateMFASecret = async (email) => {
    const secret = otplib_1.authenticator.generateSecret();
    const otpauth = otplib_1.authenticator.keyuri(email, 'PropertyAI', secret);
    const qrCode = await (0, qrcode_1.toDataURL)(otpauth);
    return { secret, qrCode };
};
exports.generateMFASecret = generateMFASecret;
const getMFASecret = async (userId) => {
    const user = await dbManager_1.prisma.user.findUnique({ where: { id: userId } });
    return (user === null || user === void 0 ? void 0 : user.mfaSecret) || null;
};
exports.getMFASecret = getMFASecret;
const isMFAEnabled = async (userId) => {
    const user = await dbManager_1.prisma.user.findUnique({ where: { id: userId } });
    return (user === null || user === void 0 ? void 0 : user.mfaEnabled) || false;
};
exports.isMFAEnabled = isMFAEnabled;
const enableMFA = async (userId) => {
    await dbManager_1.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
    });
};
exports.enableMFA = enableMFA;
const disableMFA = async (userId) => {
    await dbManager_1.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false, mfaSecret: null },
    });
};
exports.disableMFA = disableMFA;
const verifyTOTP = (secret, token) => {
    return otplib_1.authenticator.verify({ token, secret });
};
exports.verifyTOTP = verifyTOTP;
//# sourceMappingURL=mfaService.js.map