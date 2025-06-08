import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';

const prisma = new PrismaClient();

class DocumentService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadDocument(file: Express.Multer.File, userId: string) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
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

export default new DocumentService();
