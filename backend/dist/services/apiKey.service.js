"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteApiKey = exports.getApiKeysByUserId = exports.generateApiKey = void 0;
const database_1 = require("../config/database");
const crypto_1 = require("crypto");
const generateApiKey = async (userId, permissions, expiresAt) => {
    const key = (0, crypto_1.randomBytes)(32).toString('hex');
    return database_1.prisma.apiKey.create({
        data: {
            key,
            userId,
            permissions,
            expiresAt,
        },
    });
};
exports.generateApiKey = generateApiKey;
const getApiKeysByUserId = async (userId) => {
    return database_1.prisma.apiKey.findMany({
        where: { userId },
    });
};
exports.getApiKeysByUserId = getApiKeysByUserId;
const deleteApiKey = async (id) => {
    return database_1.prisma.apiKey.delete({
        where: { id },
    });
};
exports.deleteApiKey = deleteApiKey;
//# sourceMappingURL=apiKey.service.js.map