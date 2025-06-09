"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signatureService = void 0;
const database_1 = require("../config/database");
const aws_sdk_1 = require("aws-sdk");
const crypto_1 = require("crypto");
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
class SignatureService {
    async signDocument(documentId, userId, signature) {
        const document = await database_1.prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            throw new Error('Document not found');
        }
        const signatureHash = (0, crypto_1.createHmac)('sha256', process.env.SIGNATURE_SECRET)
            .update(signature)
            .digest('hex');
        await database_1.prisma.auditEntry.create({
            data: {
                action: 'SIGN_DOCUMENT',
                details: `Document ${documentId} signed by user ${userId} with signature ${signatureHash}`,
                userId,
            },
        });
        return { message: 'Document signed successfully' };
    }
}
exports.signatureService = new SignatureService();
//# sourceMappingURL=signature.service.js.map