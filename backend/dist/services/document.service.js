"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = void 0;
const database_1 = require("../config/database");
const aws_sdk_1 = require("aws-sdk");
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
class DocumentService {
    async getSignedUrlForDocument(documentId) {
        const document = await database_1.prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return null;
        }
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: document.url,
            Expires: 60 * 5, // 5 minutes
        };
        return s3.getSignedUrlPromise('getObject', params);
    }
}
exports.documentService = new DocumentService();
//# sourceMappingURL=document.service.js.map