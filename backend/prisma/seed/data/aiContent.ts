import { PrismaClient } from '@prisma/client';
import { AiContent } from '../../../src/models/mongoModels';

const prisma = new PrismaClient();

export const seedAiContent = async () => {
  console.log('Seeding AI content...');

  const properties = await prisma.property.findMany();
  const units = await prisma.unit.findMany();

  for (const property of properties) {
    await AiContent.create({
      sourceId: property.id,
      sourceType: 'Property',
      content: {
        description: `AI-generated description for ${property.name}`,
        smartPricing: Math.floor(Math.random() * 1000) + 1000,
      },
    });
  }

  for (const unit of units) {
    await AiContent.create({
      sourceId: unit.id,
      sourceType: 'Unit',
      content: {
        description: `AI-generated description for Unit ${unit.unitNumber}`,
        smartPricing: Math.floor(Math.random() * 500) + 500,
      },
    });
  }

  console.log('AI content seeded!');
};