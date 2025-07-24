import { prisma } from '../config/database';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

class DocumentService {
  public async getSignedUrlForDocument(documentId: string): Promise<string | null> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: document.url,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
  }
}

export const documentService = new DocumentService();
