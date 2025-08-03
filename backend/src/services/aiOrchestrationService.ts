import { generativeAIService } from './generativeAI.service';
import { documentService } from './document.service';
import { prisma } from '../config/database';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class AiOrchestrationService {
  startTranscriptionWorkflow(filePath: string): void {
    console.log(`Starting transcription workflow for: ${filePath}`);
  }

  async generateLeaseAgreement(
    rentalId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date,
    rentAmount: number,
    securityDeposit: number
  ): Promise<any> {
    // Use rental instead of separate property and unit
    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
    const tenant = await prisma.user.findUnique({ where: { id: tenantId } });

    if (!rental || !tenant) {
      throw new Error('Invalid rental or tenant');
    }

    const prompt = `
      Generate a standard lease agreement with the following details:
      - Landlord: ${rental.title}
      - Tenant: ${tenant.firstName} ${tenant.lastName}
      - Property Address: ${rental.address}, ${rental.city}, ${rental.state} ${rental.zipCode}
      - Unit: ${rental.unitNumber || 'N/A'}
      - Lease Term: ${startDate.toDateString()} to ${endDate.toDateString()}
      - Rent: $${rentAmount} per month
      - Security Deposit: $${securityDeposit}
    `;

    const leaseText = await generativeAIService.generateText(prompt);
    const documentName = `Lease_Agreement_${tenant.lastName}_${rental.unitNumber || rental.id}.txt`;
    const documentUrl = `leases/${documentName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: documentUrl,
      Body: leaseText,
    });
    await s3Client.send(command);

    const lease = await prisma.lease.create({
      data: {
        startDate,
        endDate,
        rentAmount,
        securityDeposit,
        leaseTerms: leaseText,
        Rental: { connect: { id: rentalId } },
        User: { connect: { id: tenantId } },
        Document: {
          create: {
            name: documentName,
            type: 'LEASE',
            url: documentUrl,
            User: { connect: { id: tenantId } },
          },
        },
      },
    });

    return lease;
  }
}

export const aiOrchestrationService = new AiOrchestrationService();
