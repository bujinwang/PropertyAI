"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const aws_sdk_1 = require("aws-sdk");
const prisma = new client_1.PrismaClient();
class DocumentService {
    constructor() {
        this.s3 = new aws_sdk_1.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });
    }
    async uploadDocument(file, userId) {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `${userId}/${file.originalname}`,
            Body: file.buffer,
        };
        const { Location } = await this.s3.upload(params).promise();
        const document = await prisma.document.create({
            data: {
                name: file.originalname,
                type: 'OTHER', // This is a placeholder
                url: Location,
                uploadedById: userId,
                size: file.size,
                mimeType: file.mimetype,
            },
        });
        return document;
    }
    async checkExpiredDocuments() {
        const documents = await prisma.document.findMany({
            where: {
                lease: {
                    endDate: {
                        lt: new Date(),
                    },
                },
            },
        });
        for (const document of documents) {
            console.log(`Document ${document.name} has expired.`);
        }
    }
}
exports.default = new DocumentService();
//# sourceMappingURL=documentService.js.map