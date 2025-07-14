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

    const property = await prisma.property.create({
      data: {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'TC',
        propertyType: 'APARTMENT',
        totalUnits: 1,
        managerId: manager.id,
        ownerId: owner.id,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        unitNumber: '101',
        propertyId: property.id,
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
        propertyId: property.id,
        unitId: unit.id,
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
