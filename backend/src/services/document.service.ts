import { prisma } from '../config/database';
import { S3 } from 'aws-sdk';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

class DocumentService {
  public async getSignedUrlForDocument(documentId: string): Promise<string | null> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return null;
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: document.url,
      Expires: 60 * 5, // 5 minutes
    };

    return s3.getSignedUrlPromise('getObject', params);
  }
}

export const documentService = new DocumentService();
