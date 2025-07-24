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
    propertyId: string,
    unitId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date,
    rentAmount: number,
    securityDeposit: number
  ): Promise<any> {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    const tenant = await prisma.user.findUnique({ where: { id: tenantId } });

    if (!property || !unit || !tenant) {
      throw new Error('Invalid property, unit, or tenant');
    }

    const prompt = `
      Generate a standard lease agreement with the following details:
      - Landlord: ${property.name}
      - Tenant: ${tenant.firstName} ${tenant.lastName}
      - Property Address: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
      - Unit: ${unit.unitNumber}
      - Lease Term: ${startDate.toDateString()} to ${endDate.toDateString()}
      - Rent: $${rentAmount} per month
      - Security Deposit: $${securityDeposit}
    `;

    const leaseText = await generativeAIService.generateText(prompt);
    const documentName = `Lease_Agreement_${tenant.lastName}_${unit.unitNumber}.txt`;
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
        unit: { connect: { id: unitId } },
        tenant: { connect: { id: tenantId } },
        documents: {
          create: {
            name: documentName,
            type: 'LEASE',
            url: documentUrl,
            uploadedBy: { connect: { id: tenantId } },
          },
        },
      },
    });

    return lease;
  }
}

export const aiOrchestrationService = new AiOrchestrationService();
