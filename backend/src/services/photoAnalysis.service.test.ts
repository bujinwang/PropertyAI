import { PrismaClient } from '@prisma/client';
import { analyzeImage, storeAnalysisResult } from './photoAnalysis.service';

const prisma = new PrismaClient();

describe('Photo Analysis Service', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should analyze an image and return a result', async () => {
    const imageUrl = 'https://example.com/image.jpg';
    const result = await analyzeImage(imageUrl);
    expect(result).toHaveProperty('issuesDetected');
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('recommendations');
  });

  it('should store an analysis result', async () => {
    const manager = await prisma.user.create({
      data: {
        email: 'manager-photo-test@test.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER',
      },
    });

    const owner = await prisma.user.create({
      data: {
        email: 'owner-photo-test@test.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'Owner',
        role: 'PROPERTY_MANAGER',
      },
    });

    const rental = await prisma.rental.create({
      data: {
        title: 'Test Property Unit 101',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'TC',
        propertyType: 'APARTMENT',
        unitNumber: '101',
        bedrooms: 1,
        bathrooms: 1,
        rent: 1000,
        deposit: 1000,
        managerId: manager.id,
        ownerId: owner.id,
        createdById: manager.id,
        status: 'ACTIVE',
        isAvailable: true,
      },
    });

    const requester = await prisma.user.create({
      data: {
        email: 'requester-photo-test@test.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'Requester',
      },
    });

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        title: 'Test Request',
        description: 'Test Description',
        rentalId: rental.id, // Use rentalId instead of propertyId and unitId
        requestedById: requester.id,
      },
    });

    const analysisResult = {
      issuesDetected: ['Plumbing'],
      severity: 'High',
      recommendations: 'Detected a significant water leak under the sink.',
    };

    await storeAnalysisResult(maintenanceRequest.id, analysisResult);

    const storedResult = await prisma.photoAnalysis.findUnique({
      where: { maintenanceRequestId: maintenanceRequest.id },
    });

    expect(storedResult).not.toBeNull();
    expect(storedResult?.issuesDetected).toEqual(['Plumbing']);
  });
});
