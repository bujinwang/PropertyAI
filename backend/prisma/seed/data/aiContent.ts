import { PrismaClient } from '@prisma/client';
import { AiContent } from '../../../src/models/mongoModels';

const prisma = new PrismaClient();

export const seedAiContent = async () => {
  console.log('Seeding AI content...');

  const properties = await prisma.property.findMany();
  const units = await prisma.unit.findMany();

  for (const property of properties) {
    await AiContent.create({
      contentId: `property-${property.id}`,
      contentType: 'property-description',
      originalPrompt: `Generate a description for property ${property.name}`,
      generatedContent: `AI-generated description for ${property.name}`,
      relatedEntityId: property.id,
      relatedEntityType: 'Property',
      modelName: 'gpt-3.5-turbo',
      createdBy: 'system',
      status: 'published'
    });
  }

  for (const unit of units) {
    await AiContent.create({
      contentId: `unit-${unit.id}`,
      contentType: 'unit-description',
      originalPrompt: `Generate a description for Unit ${unit.unitNumber}`,
      generatedContent: `AI-generated description for Unit ${unit.unitNumber}`,
      relatedEntityId: unit.id,
      relatedEntityType: 'Unit',
      modelName: 'gpt-3.5-turbo',
      createdBy: 'system',
      status: 'published'
    });
  }

  console.log('AI content seeded!');
};