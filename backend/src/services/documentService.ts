import { PrismaClient } from '@prisma/client';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const prisma = new PrismaClient();

class DocumentService {
  private s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadDocument(file: Express.Multer.File, userId: string) {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: `${userId}/${file.originalname}`,
        Body: file.buffer,
      },
    });

    const { Location } = await upload.done();

    const document = await prisma.document.create({
      data: {
        name: file.originalname,
        type: (file as any).type || 'OTHER',
        url: Location!,
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
