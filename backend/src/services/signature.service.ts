import { prisma } from '../config/database';
import { createHmac } from 'crypto';

class SignatureService {
  public async signDocument(documentId: string, userId: string, signature: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const signatureHash = createHmac('sha256', process.env.SIGNATURE_SECRET!)
      .update(signature)
      .digest('hex');

    await prisma.auditEntry.create({
      data: {
        action: 'SIGN_DOCUMENT',
        details: `Document ${documentId} signed by user ${userId} with signature ${signatureHash}`,
        userId,
      },
    });

    return { message: 'Document signed successfully' };
  }
}

export const signatureService = new SignatureService();
